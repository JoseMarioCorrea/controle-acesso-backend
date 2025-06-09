// src/idface/terminals.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';

@Controller('idface/terminals')
export class TerminalsController {
  constructor(private readonly terminals: TerminalsService) {}

  @Post()
  create(@Body() dto: CreateTerminalDto) {
    return this.terminals.create(dto);
  }

  @Get()
  findAll() {
    return this.terminals.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.terminals.findById(id);
  }
}
