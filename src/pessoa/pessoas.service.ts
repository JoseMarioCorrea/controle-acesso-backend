// src/pessoa/pessoas.service.ts
import { Injectable, NotFoundException, Logger, BadRequestException, forwardRef, Inject } from '@nestjs/common';
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
  getClientForTerminal: any;
  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
    @Inject(forwardRef(() => IdfaceService))
    private readonly idfaceService: IdfaceService, private readonly idface: IdfaceService,           // ← injete aqui
  ) { }

  async create(dto: CreatePessoaDto): Promise<Pessoa> {
    const { grupos, ...rest } = dto;
    const pessoa = this.repo.create(rest);
    let idfaceId;
    if (grupos?.length) {
      pessoa.grupos = await this.grupoRepo.findByIds(grupos);
    }

    const saved = await this.repo.save(pessoa);
    this.logger.log(`Pessoa criada no BD com id ${saved.id}`);

    // PUSH para iDFace
    try {
      const terminalId = dto.terminalId;
      const nome = saved.nome;
      const registro = saved.registro;
      const saveId: any = saved.userIdIdface
      if (typeof terminalId !== 'number') {
        throw new BadRequestException('terminalId é obrigatório para criar usuário no iDFace');
      }
      if (!saved.inativo) {
       idfaceId = await this.idface.createUserOnDevice(terminalId, nome, registro);
        this.logger.log(`Pessoa ${saved.id} liberada no iDFace`);
      } else {
        this.logger.warn(`Pessoa ${saved.id} está inativa e não será liberada no iDFace`);
      }

      this.logger.log(`Pessoa ${saved.id} criada no iDFace`);
    } catch (err) {
      this.logger.error(`Falha ao criar Pessoa ${saved.id} no iDFace`, err);
    }

    return idfaceId;
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
      const terminalId = dto.terminalId; // ajuste conforme a estrutura do seu DTO
      const id = saved.id;           // ajuste conforme o campo correto
      const registro = saved.registro;   // ajuste conforme o campo correto
      await this.idface.updateUserOnDevice(terminalId, id, registro);
      this.logger.log(`Pessoa ${id} reconfigurada no iDFace`);
    } catch (err) {
      this.logger.error(`Falha ao reconfigurar Pessoa ${id} no iDFace`, err);
    }

    return saved;
  }
  async liberarAcesso(terminalId: number, userId: number): Promise<void> {
    const client = this.getClientForTerminal(terminalId);
    const res = await client.post(`/liberar_acesso.cgi`, { user_id: userId });
    if (!res.data.success) {
      throw new Error(`Falha ao liberar acesso para usuário ${userId}`);
    }
  }


  async remove(id: number, terminalId: number): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });

    if (!pessoa) {
      this.logger.warn(`Pessoa ${id} não encontrada no banco de dados`);
      return;
    }

    // Remove do banco
    const response = await this.repo.remove(pessoa);
    this.logger.log(`✔ Pessoa ${id} removida do banco de dados`);
    if (response) {
      try {
        await this.idface.deleteUserFromDevice(terminalId, id);
        this.logger.log(`✔ Pessoa ${id} removida do terminal iDFace ${terminalId}`);
      } catch (err) {
        this.logger.error(`❌ Falha ao remover pessoa ${id} do iDFace`, err);
      }
    } else {
      // Remove do terminal iDFace
      try {
        await this.idface.deleteUserFromDevice(terminalId, id);
        this.logger.log(`✔ Pessoa ${id} removida do terminal iDFace ${terminalId}`);
      } catch (err) {
        this.logger.error(`❌ Falha ao remover pessoa ${id} do iDFace`, err);
      }
    }
  }

}
