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

  create(dto: CreateTerminalDto) {
    const terminal = this.repo.create(dto);
    return this.repo.save(terminal);
  }

  findAll() {
    return this.repo.find();
  }

  async findById(id: number) {
    const terminal = await this.repo.findOne({ where: { id } });
    if (!terminal) throw new NotFoundException('Terminal não encontrado');
    return terminal;
  }
}
