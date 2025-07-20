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

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'fs';
import { join } from 'path';

// Helpers centralizados
import {
  getUploadsPath,
  getUploadsPublicUrl,
} from '../common/uploads-path.util';

// Sync
import { SyncService } from '../sync/sync.service';
import {
  SyncTargetType,
  SyncOperation,
} from '../sync/sync-task.entity';

@Injectable()
export class PessoasService {
  private readonly logger = new Logger(PessoasService.name);

  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
    @InjectRepository(Departament)
    private readonly deptRepo: Repository<Departament>,
    private readonly sync: SyncService,
  ) { }

  /* ==================================================================
   * CREATE (apenas dados básicos; foto é via endpoint separado)
   * ==================================================================*/
  async createBase(dto: CreatePessoaDto): Promise<Pessoa> {
    const { grupos, departmentId, ...rest } = dto;

    // Departamento obrigatório
    const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
    if (!dept) {
      throw new BadRequestException(`Departamento ${departmentId} não encontrado`);
    }

    // Entidade base
    const pessoa = this.repo.create({
      ...rest,
      department: dept,
    }) as Pessoa;

    // Associa grupos (se vieram)
    if (Array.isArray(grupos) && grupos.length) {
      const encontrados = await this.grupoRepo.find({ where: { id: In(grupos) } });
      if (encontrados.length !== grupos.length) {
        throw new BadRequestException(
          `Algum grupo informado não foi encontrado. Esperados=${grupos.length} obtidos=${encontrados.length}`,
        );
      }
      pessoa.grupos = encontrados;
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa criada no DB id=${saved.id}`);

    // Enfileira criação / atualização de usuário no device
    await this.sync.createTask({
      targetType: SyncTargetType.PESSOA,
      targetId: saved.id,
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    });
    await this.sync.enqueueUnique({
      targetType: SyncTargetType.PESSOA,
      targetId: saved.id,
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    })

    // NÃO enfileira foto aqui (fotoFilename vazio). Foto será tratada no upload.
    return this.findById(saved.id);
  }

  /* ==================================================================
   * UPDATE (dados básicos e relações; foto é outro fluxo)
   * ==================================================================*/
  async updateBase(id: string, dto: UpdatePessoaDto): Promise<Pessoa> {
    const { grupos, departmentId, ...rest } = dto;

    const pessoa = await this.repo.findOne({
      where: { id },
      relations: ['department', 'grupos'],
    });
    if (!pessoa) {
      throw new NotFoundException(`Pessoa ${id} não encontrada`);
    }

    Object.assign(pessoa, rest);

    // Reatribui departamento (se informado)
    if (departmentId !== undefined) {
      const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
      if (!dept) {
        throw new BadRequestException(`Departamento ${departmentId} não encontrado`);
      }
      pessoa.department = dept;
    }

    // Reatribui grupos (se vier array – inclusive vazio para limpar)
    if (Array.isArray(grupos)) {
      const encontrados = await this.grupoRepo.find({ where: { id: In(grupos) } });
      if (encontrados.length !== grupos.length) {
        throw new BadRequestException('Algum grupo informado não foi encontrado');
      }
      pessoa.grupos = encontrados;
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa ${id} atualizada no DB`);

    // Enfileira (ou simplesmente cria) task de sincronização de dados
    await this.sync.createTask({
      targetType: SyncTargetType.PESSOA,
      targetId: saved.id,
      operation: SyncOperation.CREATE_OR_UPDATE_USER,
    });

    return this.findById(saved.id);
  }

  /* ==================================================================
   * FIND
   * ==================================================================*/
  async findAll(): Promise<Pessoa[]> {
    return this.repo.find({ relations: ['department', 'grupos'] });
  }

  async findById(id: string): Promise<Pessoa> {
    const pessoa = await this.repo.findOne({
      where: { id },
      relations: ['department', 'grupos'],
    });
    if (!pessoa) {
      throw new NotFoundException(`Pessoa ${id} não encontrada`);
    }
    return pessoa;
  }

  /* ==================================================================
   * REMOVE
   * ==================================================================*/
  async removeBase(id: string): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) {
      this.logger.warn(`⚠ Pessoa ${id} não existe (remoção idempotente)`);
      // Mesmo assim podemos enfileirar DELETE_USER para limpar mapping se houver
      await this.sync.createTask({
        targetType: SyncTargetType.PESSOA,
        targetId: id,
        operation: SyncOperation.DELETE_USER,
      });
      return;
    }

    await this.repo.remove(pessoa);
    this.logger.log(`✔ Pessoa ${id} removida do DB`);

    // Enfileira remoção do usuário no device (idempotente se já não existir)
    await this.sync.createTask({
      targetType: SyncTargetType.PESSOA,
      targetId: id,
      operation: SyncOperation.DELETE_USER,
    });
  }

  /* ==================================================================
   * FOTOS
   * - Salva arquivo
   * - Persiste nome (fotoFilename)
   * - Enfileira TEST_PHOTO (o SyncService cuida de mapping / upload)
   * ==================================================================*/
  async savePhoto(userId: string, file: Express.Multer.File): Promise<string> {
    const dir = getUploadsPath('pessoas', userId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const dest = join(dir, filename);

    if (file.buffer) writeFileSync(dest, file.buffer);
    else if (file.path) copyFileSync(file.path, dest);
    else throw new BadRequestException('Arquivo de foto inválido');

    // Atualiza entidade com nome do arquivo (persistir!)
    await this.repo.update(userId, { fotoFilename: filename });

    this.logger.log(`✔ Foto salva (persistida) pessoa=${userId} file=${filename}`);

    // Agenda TEST_PHOTO (vai acionar UPLOAD depois)
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
    // Ordena decrescente (por timestamp no prefixo) e pega a primeira
    paths.sort().reverse();
    return paths[0];
  }
}
