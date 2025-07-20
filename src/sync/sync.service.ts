// src/sync/sync.service.ts
import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import {
    SyncTask,
    SyncTaskState,
    SyncOperation,
    SyncTargetType,
    ErrorCategory,
} from './sync-task.entity';
import {
    CreateSyncTaskDto,
    RequeueSyncTaskDto,
} from './dto/create-sync-task.dto';

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

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);
    private processing = false;

    constructor(
        @InjectRepository(SyncTask)
        private readonly taskRepo: Repository<SyncTask>,
        @InjectRepository(SyncDeviceUserMap)
        private readonly mapRepo: Repository<SyncDeviceUserMap>,
        @InjectRepository(Pessoa)
        private readonly pessoaRepo: Repository<Pessoa>,
        @InjectRepository(Visitante)
        private readonly visitanteRepo: Repository<Visitante>,
        @InjectRepository(Device)
        private readonly deviceRepo: Repository<Device>,
        private readonly idface: IdfaceService,
    ) { }

    /* ==================== PUBLIC API ==================== */

    async createTask(dto: CreateSyncTaskDto): Promise<SyncTask> {
        const task = this.taskRepo.create({
            targetType: dto.targetType,
            targetId: dto.targetId,
            operation: dto.operation,
            maxAttempts: dto.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
            payload: dto.payload ?? null,
            state: SyncTaskState.PENDING,
        });
        return this.taskRepo.save(task);
    }

    async enqueueUnique(params: {
        targetType: SyncTargetType;
        targetId: string | number;
        operation: SyncOperation;
        scheduledAt?: Date | string;
        payload?: any;
        maxAttempts?: number;
    }): Promise<boolean> {
        const existing = await this.taskRepo.findOne({
            where: {
                targetType: params.targetType,
                targetId: String(params.targetId),
                operation: params.operation,
                state: SyncTaskState.PENDING,
            },
        });
        if (existing) return false;
        const scheduledAtStr =
            params.scheduledAt instanceof Date
                ? params.scheduledAt.toISOString()
                : (params.scheduledAt as string | undefined);
        await this.createTask({
            targetType: params.targetType,
            targetId: String(params.targetId),
            operation: params.operation,
            scheduledAt: scheduledAtStr,
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
        if (
            [SyncTaskState.SUCCESS, SyncTaskState.ERROR, SyncTaskState.CANCELLED].includes(
                t.state,
            )
        ) {
            return;
        }
        t.state = SyncTaskState.CANCELLED;
        await this.taskRepo.save(t);
    }

    async requeueTask(id: number, dto: RequeueSyncTaskDto): Promise<SyncTask> {
        const t = await this.getTask(id);
        if (t.state === SyncTaskState.RUNNING) {
            throw new BadRequestException('Task em execução');
        }
        t.state = SyncTaskState.PENDING;
        t.lockedAt = null;
        t.finishedAt = null;
        t.lastError = null;
        t.errorCategory = null;
        t.lastStatusCode = null;
        t.attempts = 0;
        t.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date();
        return this.taskRepo.save(t);
    }

    async dispatchNow(): Promise<{ processed: number }> {
        return { processed: await this.processLoop() };
    }

    async rebuildQueue(): Promise<{ enqueued: number }> {
        let count = 0;

        const pessoas = await this.pessoaRepo.find();
        for (const p of pessoas) {
            if (
                await this.ensureTaskUnique(
                    SyncTargetType.PESSOA,
                    p.id,
                    SyncOperation.CREATE_OR_UPDATE_USER,
                )
            )
                count++;
            if ((p as any).fotoFilename) {
                if (
                    await this.ensureTaskUnique(
                        SyncTargetType.PESSOA,
                        p.id,
                        SyncOperation.TEST_PHOTO,
                    )
                )
                    count++;
            }
        }

        const visitantes = await this.visitanteRepo.find();
        for (const v of visitantes) {
            if (
                await this.ensureTaskUnique(
                    SyncTargetType.VISITANTE,
                    v.id,
                    SyncOperation.CREATE_OR_UPDATE_USER,
                )
            )
                count++;
            if ((v as any).fotoFilename) {
                if (
                    await this.ensureTaskUnique(
                        SyncTargetType.VISITANTE,
                        v.id,
                        SyncOperation.TEST_PHOTO,
                    )
                )
                    count++;
            }
        }

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
        let processed = 0;

        try {
            const now = new Date();
            await this.releaseStaleLocks(now);

            const tasks = await this.taskRepo
                .createQueryBuilder('t')
                .where('t.state = :p', { p: SyncTaskState.PENDING })
                .andWhere('(t.scheduledAt IS NULL OR t.scheduledAt <= :now)', { now })
                .orderBy('t.scheduledAt', 'ASC')
                .addOrderBy('t.id', 'ASC')
                .limit(MAX_BATCH)
                .getMany();

            if (!tasks.length) return 0;

            for (const t of tasks) {
                t.state = SyncTaskState.RUNNING;
                t.lockedAt = new Date();
            }
            await this.taskRepo.save(tasks);

            for (const task of tasks) {
                try {
                    await this.executeTask(task);
                    task.state = SyncTaskState.SUCCESS;
                    task.finishedAt = new Date();
                } catch (e: any) {
                    const { category, retry } = this.classifyError(e);
                    task.attempts += 1;
                    task.lastError = (e?.message || 'Erro').slice(0, 1000);
                    task.errorCategory = category;
                    task.lastStatusCode = e?.response?.status ?? null;

                    const canRetry = retry && task.attempts < task.maxAttempts;
                    if (canRetry) {
                        const delay = BASE_BACKOFF_MS * Math.pow(2, task.attempts - 1);
                        task.scheduledAt = new Date(Date.now() + delay);
                        task.state = SyncTaskState.PENDING;
                        task.lockedAt = null;
                    } else {
                        task.state = SyncTaskState.ERROR;
                        task.finishedAt = new Date();
                    }

                    this.logger.warn(
                        `[SYNC] Falha task=${task.id} op=${task.operation} cat=${category} attempts=${task.attempts}/${task.maxAttempts} retry=${canRetry} msg=${task.lastError}`,
                    );
                }
                await this.taskRepo.save(task);
                processed++;
            }
        } finally {
            this.processing = false;
        }

        if (processed) {
            this.logger.log(`Processadas ${processed} tarefas de sync`);
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
                throw new Error(`Operação não implementada: ${task.operation}`);
        }
    }

    /* ==================== CLASSIFICAÇÃO DE ERRO ==================== */
    private classifyError(e: any): { category: ErrorCategory; retry: boolean } {
        const status = e?.response?.status;
        const msg = (e?.message || '').toLowerCase();

        if (this.isNonTransient(e)) return { category: 'PERMANENT', retry: false };

        if (status === 401 || status === 403)
            return { category: 'AUTH', retry: true };
        if (status === 404) return { category: 'NOT_FOUND', retry: false };
        if (status && status >= 500) return { category: 'TRANSIENT', retry: true };
        if (e?.code === 'ECONNREFUSED' || e?.code === 'ETIMEDOUT')
            return { category: 'TRANSIENT', retry: true };

        if (/visitante sem departamento/.test(msg))
            return { category: 'PERMANENT', retry: false };
        if (/pessoa sem department/.test(msg))
            return { category: 'PERMANENT', retry: false };
        if (/departamento .* sem device/.test(msg))
            return { category: 'PERMANENT', retry: false };
        if (/pessoa não encontrada/.test(msg) || /visitante não encontrado/.test(msg))
            return { category: 'PERMANENT', retry: false };
        if (/mapping ausente/.test(msg)) return { category: 'TRANSIENT', retry: true };
        if (/foto.*(não encontrada|ausente)/.test(msg))
            return { category: 'PERMANENT', retry: false };
        if (/payload inválido|validation/.test(msg))
            return { category: 'PERMANENT', retry: false };

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
            this.logger.warn(`Liberados ${locked.length} locks stale`);
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
        await this.createTask({
            targetType,
            targetId: String(targetId),
            operation,
        });
        return true;
    }

    /* ==================== OPERAÇÕES ==================== */

    private async opCreateOrUpdateUser(task: SyncTask) {
        // Device correto para o departamento atual
        const { entity, device: currentDevice } = await this.loadEntityAndDevice(task);

        let mapping = await this.mapRepo.findOne({
            where: { targetType: task.targetType, targetId: task.targetId },
        });

        /* 1. mapping existe mas device mudou  --------------------------------- */
        if (mapping && mapping.deviceId !== currentDevice.id) {
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

        /* 2. mapping correto -> só atualizar nome/registration ---------------- */
        if (mapping) {
            await this.idface.updateUsersBatch(currentDevice.id, [
                {
                    id: mapping.deviceUserId,
                    values: {
                        name: entity.nome,
                        registration:
                            (entity as any).matricula ??
                            (entity as any).cpf ??
                            String(entity.id).slice(0, 12),
                    },
                },
            ]);

            await this.idface.addUserAccess(currentDevice.id, mapping.deviceUserId);

            if ((entity as any).fotoFilename) {
                await this.ensureTaskUnique(task.targetType, task.targetId, SyncOperation.TEST_PHOTO);
            }
            return;
        }

        /* 3. sem mapping -> criar usuário no device atual ---------------------- */
        const registration =
            (entity as any).matricula ??
            (entity as any).cpf ??
            String(entity.id).slice(0, 12);

        const ids = await this.idface.createUsersBatch(currentDevice.id, [
            { name: entity.nome, registration },
        ]);
        const deviceUserId = ids?.[0];
        if (!deviceUserId) throw new Error('createUsersBatch não retornou id válido');

        await this.mapRepo.save(
            this.mapRepo.create({
                targetType: task.targetType,
                targetId: task.targetId,
                deviceId: currentDevice.id,
                deviceUserId,
            }),
        );

        await this.idface.addUserAccess(currentDevice.id, deviceUserId);

        if ((entity as any).fotoFilename) {
            await this.ensureTaskUnique(task.targetType, task.targetId, SyncOperation.TEST_PHOTO);
        }
    }

    private async opTestPhoto(task: SyncTask) {
        const { entity, device, mapping } = await this.loadEntityDeviceAndMapping(task);

        const fotoFilename = (entity as any).fotoFilename;
        if (!fotoFilename) {
            this.logger.warn(`Sem foto para testar (${task.targetType}:${task.targetId})`);
            return;
        }

        const fullPath = this.buildPhotoPath(task.targetType, entity.id, fotoFilename);

        let buffer: Buffer;
        try {
            buffer = readFileSync(fullPath);
        } catch {
            throw this.nonTransient(`Foto não encontrada em disco: ${fullPath}`);
        }

        // Chama teste real
        try {
            const test = await this.idface.testUserImage(device.id, buffer);
            if (!test?.success) {
                // Erro permanente? Depende da política -> se quiser re-tentar, lance erro comum.
                const reason =
                    (test?.errors && test.errors.map((e: any) => e.message).join(', ')) ||
                    'reprovada';
                throw this.nonTransient(`Teste de foto falhou: ${reason}`);
            }
        } catch (e) {
            // Propaga para retry/classificação
            throw e;
        }

        this.logger.log(
            `[SYNC] Teste de foto OK device=${device.id} devUser=${mapping.deviceUserId} file=${fotoFilename}`,
        );

        await this.ensureTaskUnique(
            task.targetType,
            task.targetId,
            SyncOperation.UPLOAD_PHOTO,
        );
    }

    private async opUploadPhoto(task: SyncTask) {
        const { entity, device, mapping } = await this.loadEntityDeviceAndMapping(task);

        const fotoFilename = (entity as any).fotoFilename;
        if (!fotoFilename) {
            this.logger.warn(`Sem foto para upload (${task.targetType}:${task.targetId})`);
            return;
        }

        // Evita re-upload da mesma foto se já marcado (opcional)
        if (
            (mapping as any).lastUploadedPhoto &&
            (mapping as any).lastUploadedPhoto === fotoFilename
        ) {
            this.logger.log(
                `[SYNC] Foto já enviada devUser=${mapping.deviceUserId} file=${fotoFilename} – ignorando`,
            );
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

        this.logger.log(
            `[SYNC] Upload de foto concluído device=${device.id} devUser=${mapping.deviceUserId} file=${fotoFilename}`,
        );
    }

    private async opDeleteUser(task: SyncTask) {
        await this.safeLoadEntityForDelete(task); // só para efeito colateral de validação/tipo
        const mapping = await this.mapRepo.findOne({
            where: { targetType: task.targetType, targetId: task.targetId },
        });

        if (!mapping) {
            this.logger.warn(
                `[SYNC] DELETE_USER sem mapping target=${task.targetType}:${task.targetId} – idempotente`,
            );
            return;
        }

        const device = await this.deviceRepo.findOne({ where: { id: mapping.deviceId } });
        if (!device) {
            await this.mapRepo.remove(mapping);
            this.logger.warn(`[SYNC] Mapping órfão removido (device inexistente)`);
            return;
        }

        try {
            await this.idface.deleteObjects(device.id, 'users', {
                users: { id: mapping.deviceUserId },
            });
        } catch (e: any) {
            if (!this.isUserNotFoundDeviceError(e)) throw e;
            this.logger.log(
                `[SYNC] Usuário já inexistente no device devUser=${mapping.deviceUserId}`,
            );
        }

        await this.mapRepo.remove(mapping);
        this.logger.log(
            `[SYNC] DELETE_USER concluído devUserId=${mapping.deviceUserId} device=${device.id}`,
        );
    }

    private async opReconcileUser(task: SyncTask) {
        // Placeholder (poderia checar se user existe no device, etc.)
        this.logger.log(
            `Reconciliação dummy ${task.targetType}:${task.targetId}`,
        );
    }

    /* ==================== LOAD HELPERS ==================== */

    private async loadEntity(task: SyncTask): Promise<Pessoa | Visitante> {
        if (task.targetType === SyncTargetType.PESSOA) {
            const p = await this.pessoaRepo.findOne({
                where: { id: task.targetId as any },
                relations: ['department', 'department.devices'],
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

    private async loadEntityLight(
        task: SyncTask,
    ): Promise<Pessoa | Visitante | null> {
        if (task.targetType === SyncTargetType.PESSOA) {
            return this.pessoaRepo.findOne({
                where: { id: task.targetId as any },
            });
        }
        return this.visitanteRepo.findOne({
            where: { id: Number(task.targetId) },
        });
    }

    private async safeLoadEntityForDelete(
        task: SyncTask,
    ): Promise<Pessoa | Visitante | null> {
        try {
            return await this.loadEntity(task);
        } catch {
            return null;
        }
    }

    private async findDeviceForEntity(
        targetType: SyncTargetType,
        entity: any,
    ): Promise<Device> {
        if (targetType === SyncTargetType.VISITANTE) {
            const dep = entity.grupos?.[0]?.department;
            if (!dep || !dep.devices?.length) {
                throw this.nonTransient(
                    'Visitante sem departamento/device associado via grupos',
                );
            }
            return dep.devices[0];
        }
        const dep = entity.department;
        if (!dep) throw this.nonTransient('Pessoa sem department carregado');
        if (!dep.devices?.length) {
            throw this.nonTransient(`Departamento ${dep.id} sem device`);
        }
        return dep.devices[0];
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
            await this.ensureTaskUnique(
                task.targetType,
                task.targetId,
                SyncOperation.CREATE_OR_UPDATE_USER,
            );
            throw new Error('Mapping ausente – criação enfileirada');
        }
        const device = await this.deviceRepo.findOne({
            where: { id: mapping.deviceId },
        });
        if (!device) throw this.nonTransient(`Device ${mapping.deviceId} ausente`);
        const entity = await this.loadEntityLight(task);
        if (!entity) throw new NotFoundException('Entidade não encontrada (mapping)');
        return { entity, device, mapping };
    }

    /* ==================== UTIL ==================== */

    private buildPhotoPath(
        targetType: SyncTargetType,
        id: string | number,
        filename: string,
    ): string {
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
}
