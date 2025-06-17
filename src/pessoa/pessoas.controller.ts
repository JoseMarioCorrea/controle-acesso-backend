// src/pessoa/pessoas.controller.ts
import {
  Controller, Post, Get, Body, Param, Delete, Put,
  UseInterceptors, UploadedFile, ParseIntPipe,
  UsePipes, ValidationPipe,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Express } from 'express';
import { Pessoa } from './pessoa.entity';

@Controller('pessoas')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class PessoasController {
  constructor(private readonly pessoasService: PessoasService) { }

  @Post()
  create(
    @Body() dto: CreatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    // se quiser salvar a foto no serviço, passe-a:
    return this.pessoasService.create(dto);
  }

  @Get()
  findAll(): Promise<Pessoa[]> {
    return this.pessoasService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<Pessoa> {
    return this.pessoasService.findById(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('foto'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    return this.pessoasService.update(id, dto);
  }

  @Delete(':id/:terminalId')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('terminalId', ParseIntPipe) terminalId: number
  ) {
    return this.pessoasService.remove(id, terminalId);
  }
}

