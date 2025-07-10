// src/idface/terminals.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.terminals.findById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateTerminalDto>,
  ) {
    return this.terminals.update(id, dto);
  }

  /** delete lógico */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.terminals.remove(id);
  }
}
