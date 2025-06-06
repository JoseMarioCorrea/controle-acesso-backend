// src/pessoa/pessoas.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('pessoas')
export class PessoasController {
  constructor(private readonly pessoasService: PessoasService) {}

  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  async create(
    @Body() dto: CreatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    // Retorna a entidade Pessoa completa (incluindo pendenteIdface)
    return this.pessoasService.create(dto, foto);
  }

  @Get()
  async findAll() {
    return this.pessoasService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.pessoasService.findById(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.pessoasService.delete(id);
    return { message: 'Pessoa excluída com sucesso' };
  }
}
