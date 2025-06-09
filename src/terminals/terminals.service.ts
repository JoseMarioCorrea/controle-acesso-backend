// src/terminals/terminals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Terminal } from './terminal.entity';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';

@Injectable()
export class TerminalsService {
  constructor(
    @InjectRepository(Terminal)
    private readonly repo: Repository<Terminal>,
  ) {}

  findAll(): Promise<Terminal[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Terminal> {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Terminal ${id} não encontrado`);
    return t;
  }

  create(dto: CreateTerminalDto): Promise<Terminal> {
    const ter = this.repo.create(dto);
    return this.repo.save(ter);
  }

  async update(id: number, dto: UpdateTerminalDto): Promise<Terminal> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException(`Terminal ${id} não encontrado`);
  }
}
