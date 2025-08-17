// src/pessoa/pessoas.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Grupo } from '../groups/grupo.entity';
import { Departament } from '../departments/department.entity';

import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getUploadsPath, getUploadsPublicUrl } from '../common/uploads-path.util';

// Sync ----------------------------------------------------------------
import { SyncService } from '../sync/sync.service';
import { SyncTargetType, SyncOperation } from '../sync/sync-task.entity';

// Constantes de visitante ---------------------------------------------
import {
  GENERIC_VISITOR_DEPARTMENT_ID,
  GENERIC_VISITOR_GROUP_NAME,
  GENERIC_VISITOR_GROUP_DESC,
} from '../common/constants';

@Injectable()
export class PessoasService {
  private readonly logger = new Logger(PessoasService.name);

  constructor(
    @InjectRepository(Pessoa) private readonly repo: Repository<Pessoa>,
    @InjectRepository(Grupo) private readonly grupoRepo: Repository<Grupo>,
    @InjectRepository(Departament) private readonly deptRepo: Repository<Departament>,
    private readonly sync: SyncService,
  ) { }

  /* ===================================================================
   * CREATE
   * =================================================================*/
  async createBase(dto: CreatePessoaDto): Promise<Pessoa> {
    const { grupos, departmentId, visitante, ...rest } = dto;

    const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
    if (!dept) throw new BadRequestException(`Departamento ${departmentId} não encontrado`);

    const pessoa = this.repo.create({
      ...rest,
      visitante: !!visitante,
      department: dept,
    }) as Pessoa;

    const gruposEnt = await this.resolveGroupsForPessoa(!!visitante, grupos, departmentId);
    if (gruposEnt.length) {
      pessoa.grupos = gruposEnt;
      pessoa.department = gruposEnt[0].department; // mantém coerência
    }
    else if (visitante) {
      pessoa.grupos = [await this.getOrCreateGenericGroup()];
      pessoa.department = pessoa.grupos[0].department; // garante que tenha um departamento
    } else if (departmentId) {
      const defaultGroup = await this.getOrCreateDefaultGroupForDept(departmentId);
      pessoa.grupos = [defaultGroup];
      pessoa.department = defaultGroup.department; // garante que tenha um departamento
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa criada id=${saved.id}`);

    await this.sync.enqueueUnique({
      targetType: SyncTargetType.PESSOA,
      targetId: saved.id,
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    });

    return this.findById(saved.id);
  }

  /* ===================================================================
   * UPDATE
   * =================================================================*/
  async updateBase(id: string, dto: UpdatePessoaDto): Promise<Pessoa> {
    const { grupos, departmentId, visitante, ...rest } = dto;

    const pessoa = await this.repo.findOne({ where: { id }, relations: ['department', 'grupos'] });
    if (!pessoa) throw new NotFoundException(`Pessoa ${id} não encontrada`);

    Object.assign(pessoa, rest);
    if (visitante !== undefined) pessoa.visitante = !!visitante;

    if (departmentId !== undefined) {
      const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
      if (!dept) throw new BadRequestException(`Departamento ${departmentId} não encontrado`);
      pessoa.department = dept;
    }

    if (Array.isArray(grupos) || visitante !== undefined) {
      const gruposEnt = await this.resolveGroupsForPessoa(pessoa.visitante, grupos as number[] | undefined);
      pessoa.grupos = gruposEnt;
      if (gruposEnt.length) pessoa.department = gruposEnt[0].department;
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa ${id} atualizada`);

    await this.sync.enqueueUnique({
      targetType: SyncTargetType.PESSOA,
      targetId: saved.id,
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    });

    return this.findById(saved.id);
  }

  /* ===================================================================
   * FIND
   * =================================================================*/
  async findAll(visitante?: boolean): Promise<Pessoa[]> {
    const where = visitante === undefined ? {} : { visitante };
    return this.repo.find({ where, relations: ['department', 'grupos'] });
  }

  async findById(id: string): Promise<Pessoa> {
    const pessoa = await this.repo.findOne({ where: { id }, relations: ['department', 'grupos'] });
    if (!pessoa) throw new NotFoundException(`Pessoa ${id} não encontrada`);
    return pessoa;
  }

  /* ===================================================================
   * REMOVE
   * =================================================================*/
  async removeBase(id: string): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) {
      this.logger.warn(`⚠ Pessoa ${id} não existe (remoção idempotente)`);
    } else {
      await this.repo.remove(pessoa);
      this.logger.log(`✔ Pessoa ${id} removida`);
    }

    await this.sync.enqueueUnique({
      targetType: SyncTargetType.PESSOA,
      targetId: id,
      operation: SyncOperation.DELETE_USER,
    });
  }

  /* ===================================================================
   * FOTOS
   * =================================================================*/
  async savePhoto(userId: string, file: Express.Multer.File): Promise<string> {
    const dir = getUploadsPath('pessoas', userId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const dest = join(dir, filename);

    if (file.buffer) writeFileSync(dest, file.buffer);
    else if (file.path) copyFileSync(file.path, dest);
    else throw new BadRequestException('Arquivo de foto inválido');

    await this.repo.update(userId, { fotoFilename: filename });
    this.logger.log(`✔ Foto salva pessoa=${userId} file=${filename}`);

    await this.sync.enqueueUnique({
      targetType: SyncTargetType.PESSOA,
      targetId: userId,
      operation: SyncOperation.TEST_PHOTO,
    });

    return getUploadsPublicUrl('pessoas', userId, filename);
  }

  async listPhotos(userId: string): Promise<string[]> {
    const dir = getUploadsPath('pessoas', userId);
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map(f => getUploadsPublicUrl('pessoas', userId, f));
  }

  async getLatestPhoto(userId: string): Promise<string> {
    const paths = await this.listPhotos(userId);
    if (!paths.length) return '';
    paths.sort().reverse();
    return paths[0];
  }

  /* ===================================================================
   * VISITANTE HELPERS
   * =================================================================*/
  private async getOrCreateGenericGroup(): Promise<Grupo> {
    const deptId = GENERIC_VISITOR_DEPARTMENT_ID;

    let grupo = await this.grupoRepo.findOne({
      where: { nome: GENERIC_VISITOR_GROUP_NAME, department: { id: deptId } },
      relations: ['department', 'department.devices'],
    });

    if (!grupo) {
      grupo = this.grupoRepo.create({
        nome: GENERIC_VISITOR_GROUP_NAME,
        descricao: GENERIC_VISITOR_GROUP_DESC,
        department: { id: deptId } as any,
      });
      await this.grupoRepo.save(grupo);
      grupo = await this.grupoRepo.findOne({
        where: { id: grupo.id },
        relations: ['department', 'department.devices'],
      }) as Grupo;
    }

    return grupo;
  }

  private async getOrCreateDefaultGroupForDept(deptId: number): Promise<Grupo> {
    let g = await this.grupoRepo.findOne({ where: { nome: 'DEFAULT', department: { id: deptId } }, relations: ['department'] });
    if (!g) {
      g = this.grupoRepo.create({ nome: 'DEFAULT', descricao: 'Grupo padrão', department: { id: deptId } as any });
      await this.grupoRepo.save(g);
      g = await this.grupoRepo.findOne({ where: { id: g.id }, relations: ['department'] }) as Grupo;
    }
    return g;
  }

  private async resolveGroupsForPessoa(visitante: boolean, gruposIds?: number[], deptIdForDefault?: number): Promise<Grupo[]> {
    if (visitante && (!gruposIds || !gruposIds.length)) {
      return [await this.getOrCreateGenericGroup()];
    }
    if (Array.isArray(gruposIds) && gruposIds.length) {
      const found = await this.grupoRepo.find({ where: { id: In(gruposIds) } });
      if (found.length !== gruposIds.length) throw new BadRequestException('Algum grupo informado não foi encontrado');
      return found;
    }
    // ↓↓↓ novo: default pra usuário comum
    if (!visitante && deptIdForDefault) {
      return [await this.getOrCreateDefaultGroupForDept(deptIdForDefault)];
    }
    return [];
  }

}
