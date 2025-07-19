// src/visitors/visitors.service.ts
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
import { join, dirname } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'fs';
import {
  getUploadsPath,
  getUploadsPublicUrl,
} from '../common/uploads-path.util';  // <--- NOVO


@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
  ) { }

  /**
   * Cria visitante no DB (base)
   */
  async createBase(dto: CreateVisitorDto): Promise<Visitante> {
    const { selectedGroups, visitedCompanyId, ...rest } = dto;

    if (!Array.isArray(selectedGroups) || selectedGroups.length === 0) {
      throw new BadRequestException(
        'selectedGroups deve conter ao menos um grupo',
      );
    }

    // Buscar e validar grupos
    const grupos = await this.grupoRepo.findBy({ id: In(selectedGroups) });
    if (grupos.length !== selectedGroups.length) {
      throw new BadRequestException('Algum grupo não foi encontrado');
    }

    // Criar entidade já associando tudo
    const visitante = this.visitorRepo.create({
      ...rest,
      grupos,
      visitedCompanyId,
    });

    // Salvar no banco
    const saved = await this.visitorRepo.save(visitante);
    this.logger.log(`✔ Visitante criado no DB id=${saved.id}`);
    return this.findById(saved.id);
  }

  /**
   * Atualiza visitante no DB (base)
   */
  async updateBase(
    id: number,
    dto: UpdateVisitorDto,
  ): Promise<Visitante> {
    // Carrega com relações (única instância, não array)
    const visitante = await this.visitorRepo.findOne({
      where: { id },
      relations: ['grupos'],
    });
    if (!visitante) {
      throw new NotFoundException(`Visitante ${id} não encontrado`);
    }

    const { selectedGroups, visitedCompanyId, ...rest } = dto;

    // Atualiza grupos
    if (selectedGroups) {
      const grupos = await this.grupoRepo.findBy({ id: In(selectedGroups) });
      if (grupos.length !== selectedGroups.length) {
        throw new BadRequestException('Algum grupo não foi encontrado');
      }
      visitante.grupos = grupos;
    }

    // Atualiza demais campos
    Object.assign(visitante, rest);
    if (visitedCompanyId !== undefined) {
      visitante.visitedCompanyId = visitedCompanyId;
    }

    const saved = await this.visitorRepo.save(visitante);
    this.logger.log(`✔ Visitante ${id} atualizado no DB`);
    return saved;
  }

  /**
   * Lista todos os visitantes
   */
  async findAll(): Promise<Visitante[]> {
    return this.visitorRepo.find({ relations: ['grupos'] });
  }

  /**
   * Busca visitante por ID
   */
  async findById(id: number): Promise<Visitante> {
    const visitante = await this.visitorRepo.findOne({
      where: { id },
      relations: ['grupos'],
    });
    if (!visitante) throw new NotFoundException(`Visitante ${id} não encontrado`);
    return visitante;
  }

  /**
   * Remove visitante do DB (base)
   */
  async removeBase(id: number): Promise<void> {
    const visitante = await this.findById(id);
    await this.visitorRepo.remove(visitante);
    this.logger.log(`✔ Visitante ${id} removido do DB`);
  }

  /**
    * Salva foto no disco e retorna URL pública.
    */
  async savePhoto(
    visitorId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    // Diretório físico
    const dir = getUploadsPath('visitors', String(visitorId));
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

    this.logger.log(
      `✔ Foto salva para visitante=${visitorId}, arquivo=${filename}`,
    );

    // Caminho público (para front)
    return getUploadsPublicUrl('visitors', String(visitorId), filename);
  }

  /**
   * Lista todas as URLs de fotos do visitante.
   */
  async listPhotos(visitorId: number): Promise<string[]> {
    const dir = getUploadsPath('visitors', String(visitorId));
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map(f =>
      getUploadsPublicUrl('visitors', String(visitorId), f),
    );
  }

  /**
   * Retorna URL da foto mais recente.
   */
  async getLatestPhoto(visitorId: number): Promise<string> {
    const paths = await this.listPhotos(visitorId);
    if (!paths.length) return '';
    // ordena decrescente por nome; se quiser por mtime, use fs.statSync
    paths.sort().reverse();
    return paths[0];
  }
}
