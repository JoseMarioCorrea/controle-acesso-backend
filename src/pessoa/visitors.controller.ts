// src/pessoa/visitors.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Pessoa } from './pessoa.entity';
import { Express } from 'express';

@Controller('visitors')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class VisitorsController {
  constructor(private readonly pessoasService: PessoasService) {}

  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  async createVisitor(
    @Body() dto: CreatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    // Força isVisitante = true no backend
    const payload = {
      ...dto,
      isVisitante: true,
    };
    return this.pessoasService.create(payload);
  }

  @Get()
  async findAllVisitors(): Promise<Pessoa[]> {
    const all = await this.pessoasService.findAll();
    return all.filter((p) => p.isVisitante);
  }

  @Get(':id')
  async findVisitorById(@Param('id', ParseIntPipe) id: number): Promise<Pessoa> {
    const pessoa = await this.pessoasService.findById(id);
    if (!pessoa.isVisitante) {
      throw new Error('Não é um visitante');
    }
    return pessoa;
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('foto'))
  async updateVisitor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    const payload = {
      ...dto,
      isVisitante: true, // mantém true mesmo na edição
    };
    return this.pessoasService.update(id, payload);
  }

  @Delete(':id')
  async removeVisitor(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.pessoasService.remove(id);
  }
}
