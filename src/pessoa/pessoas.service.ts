// src/pessoa/pessoas.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Grupo } from '../groups/grupo.entity';
import { IdfaceService } from '../devices/idface.service';

@Injectable()
export class PessoasService {
  private readonly logger = new Logger(PessoasService.name);

  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
    private readonly idface: IdfaceService,           // ← injete aqui
  ) { }

  async create(dto: CreatePessoaDto): Promise<Pessoa> {
    const { grupos, ...rest } = dto;
    const pessoa = this.repo.create(rest);

    if (grupos?.length) {
      pessoa.grupos = await this.grupoRepo.findByIds(grupos);
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`Pessoa criada no BD com id ${saved.id}`);

    // PUSH para iDFace
    try {
      await this.idface.ensureSession('admin', 'admin');

      await this.idface.createUserOnDevice(saved.nome, String(saved.id));
      this.logger.log(`Pessoa ${saved.id} criada no iDFace`);
    } catch (err) {
      this.logger.error(`Falha ao criar Pessoa ${saved.id} no iDFace`, err);
    }

    return saved;
  }

  async findAll(): Promise<Pessoa[]> {
    return this.repo.find({ relations: ['grupos'] });
  }

  async findById(id: number): Promise<Pessoa> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['grupos'] });
  }

  async update(id: number, dto: UpdatePessoaDto): Promise<Pessoa> {
    const { grupos, ...rest } = dto;
    const pessoa = await this.repo.preload({ id, ...rest });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');

    if (grupos) {
      pessoa.grupos = await this.grupoRepo.findByIds(grupos);
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`Pessoa ${id} atualizada no BD`);

    // opcional: reenviando configurações de autenticação ao iDFace
    try {
      await this.idface.ensureSession('admin', 'admin');
      this.logger.log(`Pessoa ${id} reconfigurada no iDFace`);
    } catch (err) {
      this.logger.error(`Falha ao reconfigurar Pessoa ${id} no iDFace`, err);
    }

    return saved;
  }

  async remove(id: number): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');
    await this.repo.remove(pessoa);
    this.logger.log(`Pessoa ${id} removida do BD`);

    // DELETE no iDFace
    try {
      await this.idface.ensureSession('admin', 'admin');

      await this.idface.deleteUserFromDevice(id);
      this.logger.log(`Pessoa ${id} removida do iDFace`);
    } catch (err) {
      this.logger.error(`Falha ao remover Pessoa ${id} do iDFace`, err);
    }
  }
}
