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
import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'fs';

// <<< helpers centralizados de caminho de upload >>>
import {
  getUploadsPath,
  getUploadsPublicUrl,
} from '../common/uploads-path.util';

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

  /* ==================================================================
   * CREATE (base)
   *  - valida dept
   *  - cria Pessoa
   *  - associa grupos (se vierem)
   *  - salva
   *  OBS: foto NÃO é gravada aqui (use POST /pessoas/:id/fotos)
   * ==================================================================*/
  async createBase(
    dto: CreatePessoaDto,
    _fotoFilename?: string, // ignorado: upload separado
  ): Promise<Pessoa> {
    const { grupos, departmentId, ...rest } = dto;

    // valida dept
    const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
    if (!dept) {
      throw new BadRequestException(
        `Departamento ${departmentId} não encontrado`,
      );
    }

    // cria entidade
    const pessoa = this.repo.create({
      ...rest,
      department: dept,
    }) as Pessoa;

    // associa grupos
    if (Array.isArray(grupos) && grupos.length) {
      const entidades = await this.grupoRepo.find({
        where: { id: In(grupos) },
      });
      if (entidades.length !== grupos.length) {
        throw new BadRequestException(
          `Algum grupo informado não foi encontrado. Esperados=${grupos.length} obtidos=${entidades.length}`,
        );
      }
      pessoa.grupos = entidades;
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa criada no DB id=${saved.id}`);
    return this.findById(saved.id); // retorna com relações
  }

  /* ==================================================================
   * UPDATE (base)
   *  - atualiza dados
   *  - (re)associa dept/grupos se fornecidos
   *  - fotoFilename NÃO é manipulado aqui (upload separado)
   * ==================================================================*/
  async updateBase(
    id: string,
    dto: UpdatePessoaDto,
    _fotoFilename?: string, // ignorado
  ): Promise<Pessoa> {
    const { grupos, departmentId, ...rest } = dto;

    // carrega com relações
    const pessoa = await this.repo.findOne({
      where: { id },
      relations: ['department', 'grupos'],
    });
    if (!pessoa) {
      throw new NotFoundException(`Pessoa ${id} não encontrada`);
    }

    // aplica campos simples
    Object.assign(pessoa, rest);

    // dept?
    if (departmentId !== undefined) {
      const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
      if (!dept) {
        throw new BadRequestException(
          `Departamento ${departmentId} não encontrado`,
        );
      }
      pessoa.department = dept;
    }

    // grupos?
    if (Array.isArray(grupos)) {
      const entidades = await this.grupoRepo.find({
        where: { id: In(grupos) },
      });
      if (entidades.length !== grupos.length) {
        throw new BadRequestException('Algum grupo informado não foi encontrado');
      }
      pessoa.grupos = entidades;
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa ${id} atualizada no DB`);
    return this.findById(saved.id);
  }

  /* ==================================================================
   * FIND all / one
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
   * REMOVE (base)
   * ==================================================================*/
  async removeBase(id: string): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) {
      this.logger.warn(`⚠ Pessoa ${id} não existe`);
      return;
    }
    await this.repo.remove(pessoa);
    this.logger.log(`✔ Pessoa ${id} removida do DB`);
  }

  /* ==================================================================
   * FOTOS
   *  - salva no disco e retorna URL pública (/uploads/pessoas/:id/...)
   *  - usa helpers compartilhados (não grava em dist/)
   * ==================================================================*/
  async savePhoto(userId: string, file: Express.Multer.File): Promise<string> {
    const dir = getUploadsPath('pessoas', userId);
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

    this.logger.log(`✔ Foto salva para pessoa=${userId}, arquivo=${filename}`);
    return getUploadsPublicUrl('pessoas', userId, filename);
  }

  async listPhotos(userId: string): Promise<string[]> {
    const dir = getUploadsPath('pessoas', userId);
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map(f =>
      getUploadsPublicUrl('pessoas', userId, f),
    );
  }

  async getLatestPhoto(userId: string): Promise<string> {
    const paths = await this.listPhotos(userId);
    if (!paths.length) return '';
    paths.sort().reverse();
    return paths[0];
  }
}
