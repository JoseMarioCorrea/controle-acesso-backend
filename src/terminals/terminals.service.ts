// src/idface/terminals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Terminal } from './terminal.entity';
import { Repository } from 'typeorm';
import { CreateTerminalDto } from './dto/create-terminal.dto';

@Injectable()
export class TerminalsService {
  constructor(
    @InjectRepository(Terminal)
    private readonly repo: Repository<Terminal>,
  ) {}

  /** cria sempre ativo */
  create(dto: CreateTerminalDto) {
    const term = this.repo.create({ ...dto, active: true });
    return this.repo.save(term);
  }

  /** lista somente ativos */
  findAll() {
    return this.repo.find({ where: { active: true } });
  }

  /** busca somente ativo */
  async findById(id: number) {
    const term = await this.repo.findOne({ where: { id, active: true } });
    if (!term) throw new NotFoundException('Terminal não encontrado');
    return term;
  }

  /** atualiza (não mexe em `active`) */
  async update(id: number, dto: Partial<CreateTerminalDto>) {
    const term = await this.findById(id);
    Object.assign(term, dto);
    return this.repo.save(term);
  }

  /** delete lógico: marca como inactive */
  async remove(id: number): Promise<void> {
    const term = await this.findById(id);
    term.active = false;
    await this.repo.save(term);
  }
}
// src/idface/terminals.service.ts