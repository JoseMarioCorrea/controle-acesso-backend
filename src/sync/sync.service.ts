// src/sync/sync.service.ts
import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    HttpException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, SelectQueryBuilder } from 'typeorm';

import {
    SyncTask,
    SyncTaskState,
    SyncOperation,
    SyncTargetType,
    ErrorCategory,
} from './sync-task.entity';
import { CreateSyncTaskDto, RequeueSyncTaskDto } from './dto/create-sync-task.dto';

import { Pessoa } from '../pessoa/pessoa.entity';
import { Visitante } from '../visitors/visitor.entity';
import { Device } from '../devices/idaface.entity';
import { IdfaceService } from '../devices/idface.service';
import { SyncDeviceUserMap } from './sync-device-user-map.entity';

import { readFileSync } from 'fs';
import { join } from 'path';
import { getUploadsPath } from 'src/common/uploads-path.util';

const DEFAULT_MAX_ATTEMPTS = 5;
const MAX_BATCH = 40;
const LOCK_TIMEOUT_MS = 60_000;
const BASE_BACKOFF_MS = 15_000;

type ErrInfo = {
    statusCode: number | null;
    message: string;
    details?: any;
    isHttpException: boolean;
};

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);
    private processing = false;

    constructor(
        @InjectRepository(SyncTask) private readonly taskRepo: Repository<SyncTask>,
        @InjectRepository(SyncDeviceUserMap) private readonly mapRepo: Repository<SyncDeviceUserMap>,
        @InjectRepository(Pessoa) private readonly pessoaRepo: Repository<Pessoa>,
        @InjectRepository(Visitante) private readonly visitanteRepo: Repository<Visitante>,
        @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
        private readonly idface: IdfaceService,
    ) { }

    /* ==================== PUBLIC API ==================== */

    async createTask(dto: CreateSyncTaskDto): Promise<SyncTask> {
        const task = this.taskRepo.create({
            targetType: dto.targetType,
            targetId: String(dto.targetId),
            operation: dto.operation,
            maxAttempts: dto.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
            payload: dto.payload ?? null,
            state: SyncTaskState.PENDING,
        });
        const saved = await this.taskRepo.save(task);
        this.logInfo('task.created', this.ctxTask(saved));
        return saved;
    }

    async enqueueUnique(params: {
        targetType: SyncTargetType;
        targetId: string | number;
        operation: SyncOperation;
        scheduledAt?: Date | string;
        payload?: any;
        maxAttempts?: number;
    }): Promise<boolean> {
        const targetId = String(params.targetId);
        const existing = await this.taskRepo.findOne({
            where: {
                targetType: params.targetType,
                targetId,
                operation: params.operation,
                state: SyncTaskState.PENDING,
            },
        });
        if (existing) {
            this.logDebug('task.enqueue.skipped.alreadyPending', this.ctx({ targetType: params.targetType, targetId, operation: params.operation }));
            return false;
        }
        await this.createTask({
            targetType: params.targetType,
            targetId,
            operation: params.operation,
            scheduledAt:
                params.scheduledAt instanceof Date
                    ? params.scheduledAt.toISOString()
                    : (params.scheduledAt as string | undefined),
            payload: params.payload,
            maxAttempts: params.maxAttempts,
        });
        return true;
    }

    async ensureDeleteTask(targetType: SyncTargetType, targetId: string) {
        return this.ensureTaskUnique(targetType, targetId, SyncOperation.DELETE_USER);
    }

    async listTasks(params: {
        state?: SyncTaskState;
        operation?: SyncOperation;
        targetType?: SyncTargetType;
        limit?: number;
        page?: number;
    }): Promise<{ data: SyncTask[]; total: number }> {
        const qb = this.taskRepo.createQueryBuilder('t').orderBy('t.id', 'DESC');
        if (params.state) qb.andWhere('t.state = :s', { s: params.state });
        if (params.operation) qb.andWhere('t.operation = :op', { op: params.operation });
        if (params.targetType) qb.andWhere('t.targetType = :tt', { tt: params.targetType });

        const limit = Math.min(params.limit ?? 50, 200);
        const page = Math.max(params.page ?? 1, 1);
        qb.take(limit).skip((page - 1) * limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async stats() {
        const total = await this.taskRepo.count();
        const byState: Record<string, number> = {};
        for (const st of Object.values(SyncTaskState)) {
            byState[st] = await this.taskRepo.count({ where: { state: st } });
        }
        return { total, byState };
    }

    async getTask(id: number): Promise<SyncTask> {
        const t = await this.taskRepo.findOne({ where: { id } });
        if (!t) throw new NotFoundException('Task não encontrada');
        return t;
    }

    async cancelTask(id: number): Promise<void> {
        const t = await this.getTask(id);
        if ([SyncTaskState.SUCCESS, SyncTaskState.ERROR, SyncTaskState.CANCELLED].includes(t.state)) {
            this.logDebug('task.cancel.skipped.finalState', this.ctxTask(t));
            return;
        }
        t.state = SyncTaskState.CANCELLED;
        await this.taskRepo.save(t);
        this.logWarn('task.cancelled', this.ctxTask(t));
    }

    async requeueTask(id: number, dto: RequeueSyncTaskDto): Promise<SyncTask> {
        const t = await this.getTask(id);
        if (t.state === SyncTaskState.RUNNING) {
            throw new BadRequestException('Task em execução');
        }
        Object.assign(t, {
            state: SyncTaskState.PENDING,
            lockedAt: null,
            finishedAt: null,
            lastError: null,
            errorCategory: null,
            lastStatusCode: null,
            attempts: 0,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
        });
        const saved = await this.taskRepo.save(t);
        this.logInfo('task.requeued', this.ctxTask(saved));
        return saved;
    }

    async dispatchNow(): Promise<{ processed: number }> {
        const processed = await this.processLoop();
        return { processed };
    }

    async rebuildQueue(): Promise<{ enqueued: number }> {
        let count = 0;

        const pessoas = await this.pessoaRepo.find();
        for (const p of pessoas) {
            if (await this.ensureTaskUnique(SyncTargetType.PESSOA, p.id, SyncOperation.CREATE_OR_UPDATE_USER)) count++;
            if ((p as any).fotoFilename) {
                if (await this.ensureTaskUnique(SyncTargetType.PESSOA, p.id, SyncOperation.TEST_PHOTO)) count++;
            }
        }

        const visitantes = await this.visitanteRepo.find();
        for (const v of visitantes) {
            if (await this.ensureTaskUnique(SyncTargetType.VISITANTE, v.id, SyncOperation.CREATE_OR_UPDATE_USER)) count++;
            if ((v as any).fotoFilename) {
                if (await this.ensureTaskUnique(SyncTargetType.VISITANTE, v.id, SyncOperation.TEST_PHOTO)) count++;
            }
        }

        this.logInfo('queue.rebuild.completed', { enqueued: count });
        return { enqueued: count };
    }

    /* ==================== CRON ==================== */
    @Cron(CronExpression.EVERY_30_SECONDS)
    async cronTick() {
        await this.processLoop();
    }

    /* ==================== LOOP ==================== */
    private async processLoop(): Promise<number> {
        if (this.processing) return 0;
        this.processing = true;

        const startedAt = Date.now();
        let processed = 0;

        try {
            const now = new Date();
            await this.releaseStaleLocks(now);

            const tasks = await this.queryPending(now).getMany();

            if (!tasks.length) {
                this.logDebug('loop.noTasks', { now: now.toISOString() });
                return 0;
            }

            // lock
            for (const t of tasks) {
                t.state = SyncTaskState.RUNNING;
                t.lockedAt = new Date();
            }
            await this.taskRepo.save(tasks);

            for (const task of tasks) {
                const t0 = Date.now();
                this.logInfo('task.begin', this.ctxTask(task));

                try {
                    await this.executeTask(task);
                    task.state = SyncTaskState.SUCCESS;
                    task.finishedAt = new Date();
                    await this.taskRepo.save(task);

                    this.logInfo('task.end', {
                        ...this.ctxTask(task),
                        durationMs: Date.now() - t0,
                    });
                } catch (e: any) {
                    const info = this.unwrapHttpError(e);
                    const { category, retry } = this.classifyError(e, info);
                    task.attempts += 1;
                    task.lastError = (info.message || 'Erro').slice(0, 1000);
                    task.errorCategory = category;
                    task.lastStatusCode = info.statusCode;

                    const canRetry = retry && task.attempts < task.maxAttempts;
                    let delayMs: number | undefined;

                    if (canRetry) {
                        delayMs = this.computeBackoff(task.attempts);
                        task.scheduledAt = new Date(Date.now() + delayMs);
                        task.state = SyncTaskState.PENDING;
                        task.lockedAt = null;
                    } else {
                        task.state = SyncTaskState.ERROR;
                        task.finishedAt = new Date();
                    }

                    await this.taskRepo.save(task);

                    this.logWarn('task.error', {
                        ...this.ctxTask(task),
                        durationMs: Date.now() - t0,
                        error: {
                            message: task.lastError,
                            statusCode: task.lastStatusCode,
                            name: e?.name,
                            code: e?.code,
                            details: this.safeDetails(info.details),
                        },
                        category,
                        attempts: task.attempts,
                        maxAttempts: task.maxAttempts,
                        retry: canRetry,
                        delayMs,
                    });
                }

                processed++;
            }
        } finally {
            this.processing = false;
            if (processed) {
                this.logInfo('loop.summary', {
                    processed,
                    durationMs: Date.now() - startedAt,
                });
            }
        }

        return processed;
    }

    /* ==================== EXECUTA UMA TASK ==================== */
    private async executeTask(task: SyncTask): Promise<void> {
        switch (task.operation) {
            case SyncOperation.CREATE_OR_UPDATE_USER:
                return this.opCreateOrUpdateUser(task);
            case SyncOperation.TEST_PHOTO:
                return this.opTestPhoto(task);
            case SyncOperation.UPLOAD_PHOTO:
                return this.opUploadPhoto(task);
            case SyncOperation.DELETE_USER:
                return this.opDeleteUser(task);
            case SyncOperation.RECONCILE_USER:
                return this.opReconcileUser(task);
            default:
                throw this.nonTransient(`Operação não implementada: ${task.operation}`);
        }
    }

    /* ==================== CLASSIFICAÇÃO DE ERRO ==================== */
    private classifyError(
        e: any,
        info?: ErrInfo,
    ): { category: ErrorCategory; retry: boolean } {
        const status = info?.statusCode ?? e?.response?.status;
        const msg = (info?.message || e?.message || '').toLowerCase();
        const bodyStr = info?.details
            ? (typeof info.details === 'string' ? info.details : JSON.stringify(info.details)).toLowerCase()
            : '';

        if (this.isNonTransient(e)) return { category: 'PERMANENT', retry: false };

        if (status === 401 || status === 403) return { category: 'AUTH', retry: true };
        if (status === 404) return { category: 'NOT_FOUND', retry: false };

        // 400 – decide por conteúdo
        if (status === 400) {
            if (/\b(unique|already exists|duplicate|violação|duplicad)/.test(bodyStr)) return { category: 'PERMANENT', retry: false };
            if (/\b(invalid|validation|required|campo obrigat|bad value|bad json)/.test(bodyStr) || /payload inválido|validation/.test(msg))
                return { category: 'PERMANENT', retry: false };
            // sessão inválida às vezes vem como 400 em firmwares antigos
            if (/\b(session|token).*(invalid|expired)\b/.test(bodyStr)) return { category: 'AUTH', retry: true };
            // fallback 400 desconhecido: falha rápida
            return { category: 'PERMANENT', retry: false };
        }

        if (status && status >= 500) return { category: 'TRANSIENT', retry: true };
        if (e?.code === 'ECONNREFUSED' || e?.code === 'ETIMEDOUT') return { category: 'TRANSIENT', retry: true };

        // regras específicas
        if (/visitante sem departamento/.test(msg)) return { category: 'PERMANENT', retry: false };
        if (/pessoa sem department/.test(msg)) return { category: 'PERMANENT', retry: false };
        if (/departamento .* sem device/.test(msg)) return { category: 'PERMANENT', retry: false };
        if (/pessoa não encontrada|visitante não encontrado/.test(msg)) return { category: 'PERMANENT', retry: false };
        if (/mapping ausente/.test(msg)) return { category: 'TRANSIENT', retry: true };
        if (/foto.*(não encontrada|ausente)/.test(msg)) return { category: 'PERMANENT', retry: false };

        return { category: 'INTERNAL', retry: true };
    }

    /* ==================== LOCKS ==================== */
    private async releaseStaleLocks(now: Date) {
        const stale = new Date(now.getTime() - LOCK_TIMEOUT_MS);
        const locked = await this.taskRepo.find({
            where: { state: SyncTaskState.RUNNING, lockedAt: LessThan(stale) },
        });
        if (locked.length) {
            for (const t of locked) {
                t.state = SyncTaskState.PENDING;
                t.lockedAt = null;
                t.lastError = (t.lastError ? t.lastError + ' | ' : '') + 'lock timeout';
            }
            await this.taskRepo.save(locked);
            this.logWarn('locks.released.stale', { count: locked.length, staleMs: LOCK_TIMEOUT_MS });
        }
    }

    private async ensureTaskUnique(
        targetType: SyncTargetType,
        targetId: string | number,
        operation: SyncOperation,
    ): Promise<boolean> {
        const existing = await this.taskRepo.findOne({
            where: {
                targetType,
                targetId: String(targetId),
                operation,
                state: SyncTaskState.PENDING,
            },
        });
        if (existing) return false;
        await this.createTask({ targetType, targetId: String(targetId), operation });
        return true;
    }

    /* ==================== OPERAÇÕES ==================== */

    private async opCreateOrUpdateUser(task: SyncTask) {
        const { entity, device: currentDevice } = await this.loadEntityAndDevice(task);

        let mapping = await this.mapRepo.findOne({
            where: { targetType: task.targetType, targetId: task.targetId },
        });

        // 1) mapping existe mas device mudou
        if (mapping && mapping.deviceId !== currentDevice.id) {
            this.logInfo('op.createOrUpdate.relocateUser', {
                ...this.ctxTask(task),
                fromDevice: mapping.deviceId,
                toDevice: currentDevice.id,
            });

            try {
                await this.idface.deleteObjects(mapping.deviceId, 'users', {
                    users: { id: mapping.deviceUserId },
                });
            } catch (e) {
                if (!this.isUserNotFoundDeviceError(e)) throw e;
            }
            await this.mapRepo.remove(mapping);
            mapping = null;
        }

        // validação + normalização
        const registrationRaw =
            (entity as any).matricula ?? (entity as any).cpf ?? String(entity.id).slice(0, 12);

        if (!entity.nome || typeof entity.nome !== 'string' || entity.nome.trim().length < 2) {
            throw this.nonTransient('payload inválido: nome ausente/curto');
        }
        if (!registrationRaw || String(registrationRaw).trim().length < 3) {
            throw this.nonTransient('payload inválido: registration ausente/curta');
        }

        const values = {
            name: entity.nome.trim().slice(0, 64),
            registration: String(registrationRaw).trim().slice(0, 32),
        };

        // 2) mapping ok -> atualizar
        if (mapping) {
            await this.idface.updateUsersBatch(currentDevice.id, [
                { id: mapping.deviceUserId, values },
            ]);

            await this.idface.addUserAccess(currentDevice.id, mapping.deviceUserId);

            this.logInfo('op.createOrUpdate.updated', {
                ...this.ctxTask(task),
                deviceId: currentDevice.id,
                deviceUserId: mapping.deviceUserId,
            });

            if ((entity as any).fotoFilename) {
                await this.ensureTaskUnique(task.targetType, task.targetId, SyncOperation.TEST_PHOTO);
            }
            return;
        }

        // 3) sem mapping -> criar
        const ids = await this.idface.createUsersBatch(currentDevice.id, [
            { name: values.name, registration: values.registration },
        ]);
        const deviceUserId = ids?.[0];
        if (!deviceUserId) throw this.nonTransient('createUsersBatch não retornou id válido');

        await this.mapRepo.save(
            this.mapRepo.create({
                targetType: task.targetType,
                targetId: task.targetId,
                deviceId: currentDevice.id,
                deviceUserId,
            }),
        );

        await this.idface.addUserAccess(currentDevice.id, deviceUserId);

        this.logInfo('op.createOrUpdate.created', {
            ...this.ctxTask(task),
            deviceId: currentDevice.id,
            deviceUserId,
        });

        if ((entity as any).fotoFilename) {
            await this.ensureTaskUnique(task.targetType, task.targetId, SyncOperation.TEST_PHOTO);
        }
    }

    private async opTestPhoto(task: SyncTask) {
        const { entity, device, mapping } = await this.loadEntityDeviceAndMapping(task);

        const fotoFilename = (entity as any).fotoFilename;
        if (!fotoFilename) {
            this.logWarn('op.testPhoto.noPhoto', this.ctxTask(task));
            return;
        }

        const fullPath = this.buildPhotoPath(task.targetType, entity.id, fotoFilename);

        let buffer: Buffer;
        try {
            buffer = readFileSync(fullPath);
        } catch {
            throw this.nonTransient(`Foto não encontrada em disco: ${fullPath}`);
        }

        const test = await this.idface.testUserImage(device.id, buffer);
        if (!test?.success) {
            const reason = (test?.errors && test.errors.map((e: any) => e.message).join(', ')) || 'reprovada';
            throw this.nonTransient(`Teste de foto falhou: ${reason}`);
        }

        this.logInfo('op.testPhoto.ok', {
            ...this.ctxTask(task),
            deviceId: device.id,
            deviceUserId: mapping.deviceUserId,
            filename: fotoFilename,
        });

        await this.ensureTaskUnique(task.targetType, task.targetId, SyncOperation.UPLOAD_PHOTO);
    }

    private async opUploadPhoto(task: SyncTask) {
        const { entity, device, mapping } = await this.loadEntityDeviceAndMapping(task);
        const fotoFilename = (entity as any).fotoFilename;
        if (!fotoFilename) {
            this.logWarn('op.uploadPhoto.noPhoto', this.ctxTask(task));
            return;
        }

        if ((mapping as any).lastUploadedPhoto === fotoFilename) {
            this.logDebug('op.uploadPhoto.skipped.sameFile', {
                ...this.ctxTask(task),
                deviceUserId: mapping.deviceUserId,
                filename: fotoFilename,
            });
            return;
        }

        const fullPath = this.buildPhotoPath(task.targetType, entity.id, fotoFilename);

        let buffer: Buffer;
        try {
            buffer = readFileSync(fullPath);
        } catch {
            throw this.nonTransient(`Foto não encontrada em disco: ${fullPath}`);
        }

        await this.idface.uploadUserPhoto(device.id, mapping.deviceUserId, buffer);

        if ('lastUploadedPhoto' in mapping) {
            (mapping as any).lastUploadedPhoto = fotoFilename;
            (mapping as any).lastUploadedAt = new Date();
            await this.mapRepo.save(mapping);
        }

        this.logInfo('op.uploadPhoto.done', {
            ...this.ctxTask(task),
            deviceId: device.id,
            deviceUserId: mapping.deviceUserId,
            filename: fotoFilename,
        });
    }

    private async opDeleteUser(task: SyncTask) {
        await this.safeLoadEntityForDelete(task); // validação leve
        const mapping = await this.mapRepo.findOne({
            where: { targetType: task.targetType, targetId: task.targetId },
        });

        if (!mapping) {
            this.logWarn('op.deleteUser.noMapping.idempotent', this.ctxTask(task));
            return;
        }

        const device = await this.deviceRepo.findOne({ where: { id: mapping.deviceId } });
        if (!device) {
            await this.mapRepo.remove(mapping);
            this.logWarn('op.deleteUser.orphanMapping.removed', { ...this.ctxTask(task), mappingDeviceId: mapping.deviceId });
            return;
        }

        try {
            await this.idface.deleteObjects(device.id, 'users', { users: { id: mapping.deviceUserId } });
        } catch (e: any) {
            if (!this.isUserNotFoundDeviceError(e)) throw e;
            this.logInfo('op.deleteUser.alreadyMissing', { ...this.ctxTask(task), deviceUserId: mapping.deviceUserId });
        }

        await this.mapRepo.remove(mapping);
        this.logInfo('op.deleteUser.done', { ...this.ctxTask(task), deviceId: device.id, deviceUserId: mapping.deviceUserId });
    }

    private async opReconcileUser(task: SyncTask) {
        this.logInfo('op.reconcileUser.noop', this.ctxTask(task));
    }

    /* ==================== LOAD HELPERS ==================== */

    private async loadEntity(task: SyncTask): Promise<Pessoa | Visitante> {
        if (task.targetType === SyncTargetType.PESSOA) {
            const p = await this.pessoaRepo.findOne({
                where: { id: task.targetId as any },
                relations: [
                    'department',
                    'department.devices',
                    'grupos',
                    'grupos.department',
                    'grupos.department.devices',
                ],
            });
            if (!p) throw new NotFoundException('Pessoa não encontrada');
            return p;
        }
        const v = await this.visitanteRepo.findOne({
            where: { id: Number(task.targetId) },
            relations: ['grupos', 'grupos.department', 'grupos.department.devices'],
        });
        if (!v) throw new NotFoundException('Visitante não encontrado');
        return v;
    }
    private pickDepartmentFromEntityWithSource(entity: any) {
        const viaGrupo = entity?.grupos?.[0]?.department;
        if (viaGrupo) return { dep: viaGrupo, source: 'grupo' };
        return { dep: entity?.department ?? null, source: 'department' };
    }

    private async findDeviceForEntity(_targetType: SyncTargetType, entity: any): Promise<Device> {
        const { dep, source } = this.pickDepartmentFromEntityWithSource(entity);
        if (!dep) throw this.nonTransient('Entidade sem departamento (via grupo ou direto)');
        if (!dep.devices?.length) throw this.nonTransient(`Departamento ${dep.id} sem device`);
        this.logDebug('device.pick', { source, departmentId: dep.id, devices: dep.devices.map((d: any) => d.id) });
        return dep.devices[0];
    }


    private async loadEntityLight(task: SyncTask): Promise<Pessoa | Visitante | null> {
        if (task.targetType === SyncTargetType.PESSOA) {
            return this.pessoaRepo.findOne({ where: { id: task.targetId as any } });
        }
        return this.visitanteRepo.findOne({ where: { id: Number(task.targetId) } });
    }

    private async safeLoadEntityForDelete(task: SyncTask): Promise<Pessoa | Visitante | null> {
        try {
            return await this.loadEntity(task);
        } catch {
            return null;
        }
    }

    private async loadEntityAndDevice(task: SyncTask) {
        const entity = await this.loadEntity(task);
        const device = await this.findDeviceForEntity(task.targetType, entity);
        return { entity, device };
    }

    private async loadEntityDeviceAndMapping(task: SyncTask) {
        const mapping = await this.mapRepo.findOne({
            where: { targetType: task.targetType, targetId: task.targetId },
        });
        if (!mapping) {
            await this.ensureTaskUnique(task.targetType, task.targetId, SyncOperation.CREATE_OR_UPDATE_USER);
            throw new Error('Mapping ausente – criação enfileirada');
        }
        const device = await this.deviceRepo.findOne({ where: { id: mapping.deviceId } });
        if (!device) throw this.nonTransient(`Device ${mapping.deviceId} ausente`);
        const entity = await this.loadEntityLight(task);
        if (!entity) throw new NotFoundException('Entidade não encontrada (mapping)');
        return { entity, device, mapping };
    }

    /* ==================== UTIL ==================== */

    private queryPending(now: Date): SelectQueryBuilder<SyncTask> {
        return this.taskRepo
            .createQueryBuilder('t')
            .where('t.state = :p', { p: SyncTaskState.PENDING })
            .andWhere('(t.scheduledAt IS NULL OR t.scheduledAt <= :now)', { now })
            .orderBy('t.scheduledAt', 'ASC')
            .addOrderBy('t.id', 'ASC')
            .limit(MAX_BATCH);
    }

    private buildPhotoPath(targetType: SyncTargetType, id: string | number, filename: string): string {
        const baseDir =
            targetType === SyncTargetType.VISITANTE
                ? getUploadsPath('visitors', id.toString())
                : getUploadsPath('pessoas', id.toString());
        return join(baseDir, filename);
    }

    private isUserNotFoundDeviceError(e: any): boolean {
        const msg = (e?.message || '').toLowerCase();
        return msg.includes('not found') || msg.includes('inexist');
    }

    private nonTransient(message: string): Error {
        const err = new Error(message);
        (err as any).__nonTransient = true;
        return err;
    }

    private isNonTransient(e: any): boolean {
        return !!e?.__nonTransient;
    }

    private computeBackoff(attempts: number) {
        return BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempts - 1));
    }

    private unwrapHttpError(e: any): ErrInfo {
        // Nest HttpException
        if (e instanceof HttpException) {
            const status = e.getStatus?.() ?? null;
            const resp = e.getResponse?.();
            const details = typeof resp === 'string' ? { message: resp } : resp;
            return {
                statusCode: status,
                message: (typeof details === 'object' && details !== null && 'message' in details ? (details as any).message : undefined) || e.message || 'HttpException',
                details,
                isHttpException: true,
            };
        }
        // AxiosError
        if (e?.isAxiosError) {
            const status = e.response?.status ?? null;
            const data = e.response?.data;
            return {
                statusCode: status,
                message: e.message || 'AxiosError',
                details: data,
                isHttpException: false,
            };
        }
        // Fallback
        return {
            statusCode: e?.response?.status ?? null,
            message: e?.message ?? 'Error',
            details: e?.response?.data,
            isHttpException: false,
        };
    }

    /** Evita vazar PII no log */
    private safeDetails(details: any) {
        try {
            if (!details) return undefined;
            const obj = typeof details === 'string' ? JSON.parse(details) : { ...details };
            const mask = (v: any) =>
                typeof v === 'string' ? v.replace(/\b(\d{3})\d{3}(\d{3})\b/g, '$1***$2') : v;
            const walk = (o: any) => {
                if (!o || typeof o !== 'object') return o;
                for (const k of Object.keys(o)) {
                    if (/cpf|registration|matric/i.test(k)) o[k] = mask(o[k]);
                    else if (typeof o[k] === 'object') o[k] = walk(o[k]);
                }
                return o;
            };
            return walk(obj);
        } catch {
            return details;
        }
    }

    /* ==================== LOG HELPERS ==================== */

    private ctx(extra?: Record<string, any>) {
        return extra ?? {};
    }

    private ctxTask(task: SyncTask, extra?: Record<string, any>) {
        return {
            taskId: task.id,
            op: task.operation,
            state: task.state,
            target: `${task.targetType}:${task.targetId}`,
            attempts: task.attempts,
            maxAttempts: task.maxAttempts,
            scheduledAt: task.scheduledAt?.toISOString?.() ?? task.scheduledAt,
            ...extra,
        };
    }

    private logInfo(msg: string, meta?: Record<string, any>) {
        this.logger.log({ msg, ...meta });
    }
    private logWarn(msg: string, meta?: Record<string, any>) {
        this.logger.warn({ msg, ...meta });
    }
    private logDebug(msg: string, meta?: Record<string, any>) {
        this.logger.debug({ msg, ...meta });
    }
}
