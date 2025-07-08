// src/pessoa/pessoas.service.ts
import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Grupo } from '../groups/grupo.entity';
import { IdfaceService } from '../devices/idface.service';
import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'fs';

@Injectable()
export class PessoasService {
  private readonly logger = new Logger(PessoasService.name);

  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
    @Inject(forwardRef(() => IdfaceService))
    private readonly idface: IdfaceService,
  ) {}

  /**
   * Cria nova pessoa (sem foto física) e libera no iDFace
   */
  async create(
    dto: CreatePessoaDto,
    foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    const { grupos, ...rest } = dto;

    // 1) Atribui todos os campos obrigatórios de rest (nome, matricula, rg, etc)
    const pessoa = this.repo.create(rest);

    // 2) Se vier lista de grupos, faz o findByIds na propriedade correta `selectedGroups`
    if (grupos?.length) {
      pessoa.selectedGroups = await this.grupoRepo.findByIds(grupos);
    }

    // 3) Persiste no banco
    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa criada no DB com id=${saved.id}`);

    // 4) Envia para iDFace, se necessário
    try {
      const termId = dto.terminalId;
      if (typeof termId !== 'number') {
        throw new BadRequestException('terminalId é obrigatório');
      }
      if (!saved.inativo) {
        await this.idface.createUserOnDevice(
          termId,
          saved.nome,
          saved.registro,
        );
        this.logger.log(`✔ Pessoa ${saved.id} criada no iDFace`);
      }
    } catch (err) {
      this.logger.error(
        `❌ Erro criando pessoa ${saved.id} no iDFace`,
        err,
      );
    }

    return saved;
  }

  /** Lista todas as pessoas, já trazendo os grupos */
  async findAll(): Promise<Pessoa[]> {
    return this.repo.find({ relations: ['selectedGroups'] });
  }

  /** Busca pessoa por ID, já trazendo os grupos */
  async findById(id: number): Promise<Pessoa> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: ['selectedGroups'],
    });
  }

  /** Atualiza dados de pessoa e reconfigura no iDFace */
  async update(
    id: number,
    dto: UpdatePessoaDto,
    foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    const { grupos, ...rest } = dto;

    // preload já atribui rest (nome, matricula...) e carrega a entidade
    const pessoa = await this.repo.preload({ id, ...rest });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');

    // se vier selectedGroups no DTO, faz o findByIds e atribui
    if (grupos) {
      pessoa.selectedGroups = await this.grupoRepo.findByIds(grupos);
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`✔ Pessoa ${id} atualizada no DB`);

    // reconfigura no iDFace
    try {
      await this.idface.updateUserOnDevice(
        dto.terminalId,
        saved.id,
        { registro: saved.registro },
      );
      this.logger.log(`✔ Pessoa ${id} reconfigurada no iDFace`);
    } catch (err) {
      this.logger.error(
        `❌ Falha ao reconfigurar pessoa ${id} no iDFace`,
        err,
      );
    }

    return saved;
  }

  /** Remove pessoa do DB e do iDFace */
  async remove(id: number, terminalId: number): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) {
      this.logger.warn(`⚠ Pessoa ${id} não existe`);
      return;
    }

    await this.repo.remove(pessoa);
    this.logger.log(`✔ Pessoa ${id} removida do DB`);

    try {
      await this.idface.deleteUserFromDevice(terminalId, id);
      this.logger.log(`✔ Pessoa ${id} removida do iDFace`);
    } catch (err) {
      this.logger.error(
        `❌ Erro ao remover pessoa ${id} do iDFace`,
        err,
      );
    }
  }

  /**
   * Grava o arquivo de foto em uploads/pessoas/:userId (fallback buffer e path) e retorna o path público
   */
  async savePhoto(
    userId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const baseDir = process.cwd();
    const dir = join(baseDir, 'uploads', 'pessoas', String(userId));
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

    // retorna path público para servir estático
    return `/uploads/pessoas/${userId}/${filename}`;
  }

  /** Lista todas as fotos de um usuário */
  async listPhotos(userId: number): Promise<string[]> {
    const dir = join(process.cwd(), 'uploads', 'pessoas', String(userId));
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map(f => `/uploads/pessoas/${userId}/${f}`);
  }

  /** Retorna a foto mais recente, baseado em ordenação pelo nome */
  async getLatestPhoto(userId: number): Promise<string> {
    const paths = await this.listPhotos(userId);
    if (!paths.length) return '';
    paths.sort().reverse();
    return paths[0];
  }
}
