import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Visitante } from './visitor.entity';
import { CreateVisitorDto } from './dto/create-visitors.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { Grupo } from '../groups/grupo.entity';

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'fs';
import { join } from 'path';

import {
  getUploadsPath,
  getUploadsPublicUrl,
} from '../common/uploads-path.util';

import { SyncService } from '../sync/sync.service';
import {
  SyncOperation,
  SyncTargetType,
} from '../sync/sync-task.entity';

import {
  GENERIC_VISITOR_DEPARTMENT_ID,
  GENERIC_VISITOR_GROUP_NAME,
  GENERIC_VISITOR_GROUP_DESC,
} from '../common/constants';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
    private readonly sync: SyncService,
  ) { }

  /* =========================================================
   * CREATE (base) – sempre força grupo genérico
   * ======================================================= */
  async createBase(dto: CreateVisitorDto): Promise<Visitante> {
    const {
      // ignoramos seleção externa de grupos neste momento
      selectedGroups: _ignored,
      visitedCompanyId,
      ...rest
    } = dto;

    const genericGroup = await this.getOrCreateGenericGroup();

    const visitante = this.visitorRepo.create({
      ...rest,
      visitedCompanyId,
      grupos: [genericGroup],
    });

    const saved = await this.visitorRepo.save(visitante);
    this.logger.log(`✔ Visitante criado id=${saved.id}`);

    // Sincronização inicial (com uniqueness para evitar duplicatas)
    await this.sync.enqueueUnique({
      targetType: SyncTargetType.VISITANTE,
      targetId: saved.id,
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    }) || await this.sync.createTask({
      targetType: SyncTargetType.VISITANTE,
      targetId: saved.id.toString(),
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    });

    if ((saved as any).fotoFilename) {
      await this.sync.enqueueUnique?.({
        targetType: SyncTargetType.VISITANTE,
        targetId: saved.id.toString(),
        operation: SyncOperation.TEST_PHOTO,
      }) || await this.sync.createTask({
        targetType: SyncTargetType.VISITANTE,
        targetId: saved.id.toString(),
        operation: SyncOperation.TEST_PHOTO,
      });
    }

    return this.findById(saved.id);
  }

  /* =========================================================
   * UPDATE (base) – reforça grupo genérico
   * ======================================================= */
  async updateBase(id: number, dto: UpdateVisitorDto): Promise<Visitante> {
    const visitante = await this.visitorRepo.findOne({
      where: { id },
      relations: ['grupos'],
    });
    if (!visitante) {
      throw new NotFoundException(`Visitante ${id} não encontrado`);
    }

    const {
      selectedGroups: _ignored,
      visitedCompanyId,
      ...rest
    } = dto;

    Object.assign(visitante, rest);
    if (visitedCompanyId !== undefined) {
      visitante.visitedCompanyId = visitedCompanyId;
    }

    // Reforça grupo genérico sempre
    const genericGroup = await this.getOrCreateGenericGroup();
    visitante.grupos = [genericGroup];

    const saved = await this.visitorRepo.save(visitante);
    this.logger.log(`✔ Visitante ${id} atualizado`);

    await this.sync.enqueueUnique?.({
      targetType: SyncTargetType.VISITANTE,
      targetId: saved.id.toString(),
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    }) || await this.sync.createTask({
      targetType: SyncTargetType.VISITANTE,
      targetId: saved.id.toString(),
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    });

    return saved;
  }

  /* =========================================================
   * FIND
   * ======================================================= */
  async findAll(): Promise<Visitante[]> {
    return this.visitorRepo.find({ relations: ['grupos'] });
  }

  async findById(id: number): Promise<Visitante> {
    const visitante = await this.visitorRepo.findOne({
      where: { id },
      relations: ['grupos'],
    });
    if (!visitante) throw new NotFoundException(`Visitante ${id} não encontrado`);
    return visitante;
  }

  /* =========================================================
   * REMOVE
   * ======================================================= */
  async removeBase(id: number): Promise<void> {
    const visitante = await this.findById(id);
    await this.visitorRepo.remove(visitante);
    this.logger.log(`✔ Visitante ${id} removido`);

    await this.sync.enqueueUnique?.({
      targetType: SyncTargetType.VISITANTE,
      targetId: id.toString(),
      operation: SyncOperation.DELETE_USER,
    }) || await this.sync.createTask({
      targetType: SyncTargetType.VISITANTE,
      targetId: id.toString(),
      operation: SyncOperation.DELETE_USER,
    });
  }

  /* =========================================================
   * FOTOS
   * ======================================================= */
  async savePhoto(visitorId: number, file: Express.Multer.File): Promise<string> {
    const dir = getUploadsPath('visitors', visitorId.toString());
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const dest = join(dir, filename);

    if (file.buffer) writeFileSync(dest, file.buffer);
    else if (file.path) copyFileSync(file.path, dest);
    else throw new BadRequestException('Arquivo de foto inválido');

    await this.visitorRepo.update(visitorId, { fotoFilename: filename });

    this.logger.log(`✔ Foto salva (persistida) visitante=${visitorId} file=${filename}`);

    await this.sync.enqueueUnique({
      targetType: SyncTargetType.VISITANTE,
      targetId: visitorId.toString(),
      operation: SyncOperation.TEST_PHOTO,
    });

    return getUploadsPublicUrl('visitors', visitorId.toString(), filename);
  }


  async listPhotos(visitorId: number): Promise<string[]> {
    const dir = getUploadsPath('visitors', visitorId.toString());
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map(f =>
      getUploadsPublicUrl('visitors', visitorId.toString(), f),
    );
  }

  async getLatestPhoto(visitorId: number): Promise<string> {
    const paths = await this.listPhotos(visitorId);
    if (!paths.length) return '';
    paths.sort().reverse();
    return paths[0];
  }

  /* =========================================================
   * HELPER: grupo genérico
   * ======================================================= */
  private async getOrCreateGenericGroup(): Promise<Grupo> {
    const deptId = GENERIC_VISITOR_DEPARTMENT_ID;

    let grupo = await this.grupoRepo.findOne({
      where: {
        nome: GENERIC_VISITOR_GROUP_NAME,
        department: { id: deptId },
      },
      relations: ['department'],
    });

    if (!grupo) {
      grupo = this.grupoRepo.create({
        nome: GENERIC_VISITOR_GROUP_NAME,
        descricao: GENERIC_VISITOR_GROUP_DESC,
        department: { id: deptId } as any,
      });
      grupo = await this.grupoRepo.save(grupo);
    }

    return grupo;
  }
}
