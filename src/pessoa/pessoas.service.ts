// src/pessoa/pessoas.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Grupo } from '../groups/grupo.entity';
import { Departament } from '../departments/department.entity';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'fs';

function getBaseDir(): string {
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  return runningInPkg ? dirname(process.execPath) : join(__dirname, '..');
}

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
  ) {}

  /**
   * Cria pessoa e associa foto, departamento e grupos (base).
   */
  async createBase(
    dto: CreatePessoaDto,
    fotoFilename?: string
  ): Promise<Pessoa> {
    const { grupos, departmentId, ...rest } = dto;

    // Valida departamento
    const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
    if (!dept) {
      throw new BadRequestException(`Departamento ${departmentId} não encontrado`);
    }

    const pessoa = this.repo.create({ ...rest, department: dept, fotoFilename });

    // Associa grupos, se houver
    if (grupos?.length) {
      pessoa.grupos = await this.grupoRepo.findByIds(grupos);
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa criada no DB com id=${saved.id}`);
    return saved;
  }

  /**
   * Atualiza pessoa e foto, departamento e grupos (base).
   */
  async updateBase(
    id: string,
    dto: UpdatePessoaDto,
    fotoFilename?: string
  ): Promise<Pessoa> {
    const { grupos, departmentId, ...rest } = dto;

    const pessoa = await this.repo.preload({ id, ...rest });
    if (!pessoa) {
      throw new NotFoundException(`Pessoa ${id} não encontrada`);
    }

    // Atualiza departamento, se fornecido
    if (departmentId !== undefined) {
      const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
      if (!dept) {
        throw new BadRequestException(`Departamento ${departmentId} não encontrado`);
      }
      pessoa.department = dept;
    }

    // Atualiza grupos, se fornecido
    if (grupos) {
      pessoa.grupos = await this.grupoRepo.findByIds(grupos);
    }

    // Atualiza foto
    if (fotoFilename) {
      pessoa.fotoFilename = fotoFilename;
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa ${id} atualizada no DB`);
    return saved;
  }

  /**
   * Lista todas as pessoas com departamentos e grupos.
   */
  async findAll(): Promise<Pessoa[]> {
    return this.repo.find({ relations: ['department', 'grupos'] });
  }

  /**
   * Busca pessoa pelo ID.
   */
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

  /**
   * Remove pessoa do banco (base).
   */
  async removeBase(id: string): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) {
      this.logger.warn(`⚠ Pessoa ${id} não existe`);
      return;
    }
    await this.repo.remove(pessoa);
    this.logger.log(`✔ Pessoa ${id} removida do DB`);
  }

  /**
   * Salva foto no disco e retorna URL pública.
   */
  async savePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const baseDir = getBaseDir();
    const dir = join(baseDir, 'uploads', 'pessoas', userId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const dest = join(dir, filename);

    if (file.buffer) {
      writeFileSync(dest, file.buffer);
    } else if (file.path) {
      copyFileSync(file.path, dest);
    } else {
      throw new BadRequestException('Arquivo de foto inválido');
    }

    return `/uploads/pessoas/${userId}/${filename}`;
  }

  /**
   * Retorna todas as URLs de fotos do usuário.
   */
  async listPhotos(userId: string): Promise<string[]> {
    const baseDir = getBaseDir();
    const dir = join(baseDir, 'uploads', 'pessoas', userId);
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map(f => `/uploads/pessoas/${userId}/${f}`);
  }

  /**
   * Retorna a URL da foto mais recente.
   */
  async getLatestPhoto(userId: string): Promise<string> {
    const paths = await this.listPhotos(userId);
    if (!paths.length) return '';
    paths.sort().reverse();
    return paths[0];
  }
}
