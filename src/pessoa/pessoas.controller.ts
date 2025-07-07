// src/pessoa/pessoas.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  NotFoundException,
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
  constructor(private readonly pessoasService: PessoasService) {}

  /** POST /pessoas */
  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  create(
    @Body() dto: CreatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    return this.pessoasService.create(dto, foto);
  }

  /** GET /pessoas */
  @Get()
  findAll(): Promise<Pessoa[]> {
    return this.pessoasService.findAll();
  }

  /** GET /pessoas/:id */
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<Pessoa> {
    return this.pessoasService.findById(id);
  }

  /** PUT /pessoas/:id */
  @Put(':id')
  @UseInterceptors(FileInterceptor('foto'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    return this.pessoasService.update(id, dto, foto);
  }

  /** DELETE /pessoas/:id/:terminalId */
  @Delete(':id/:terminalId')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('terminalId', ParseIntPipe) terminalId: number,
  ): Promise<void> {
    return this.pessoasService.remove(id, terminalId);
  }

  /** POST /pessoas/:id/fotos */
  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('foto'))
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() foto: Express.Multer.File,
  ): Promise<{ path: string }> {
    const path = await this.pessoasService.savePhoto(id, foto);
    return { path };
  }

  /** GET /pessoas/:id/fotos */
  @Get(':id/fotos')
  listPhotos(@Param('id', ParseIntPipe) id: number): Promise<string[]> {
    return this.pessoasService.listPhotos(id);
  }

  /** GET /pessoas/:id/fotos/latest */
  @Get(':id/fotos/latest')
  async latestPhoto(@Param('id', ParseIntPipe) id: number): Promise<{ path: string }> {
    const path = await this.pessoasService.getLatestPhoto(id);
    if (!path) throw new NotFoundException('Nenhuma foto encontrada');
    return { path };
  }
}
  