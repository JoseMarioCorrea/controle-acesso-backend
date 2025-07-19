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
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Pessoa } from './pessoa.entity';

@Controller('pessoas')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class PessoasController {
  constructor(private readonly pessoasService: PessoasService) {}

  /** Cria pessoa (base) */
  @Post()
  create(@Body() dto: CreatePessoaDto): Promise<Pessoa> {
    return this.pessoasService.createBase(dto);
  }

  /** Lista todas as pessoas com depto e grupos */
  @Get()
  findAll(): Promise<Pessoa[]> {
    return this.pessoasService.findAll();
  }

  /** Busca pessoa por ID */
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<Pessoa> {
    return this.pessoasService.findById(id);
  }

  /** Atualiza pessoa (base) */
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePessoaDto,
  ): Promise<Pessoa> {
    return this.pessoasService.updateBase(id, dto);
  }

  /** Remove pessoa (base) */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.pessoasService.removeBase(id);
  }

  /** Upload de foto */
  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('foto')) // aqui sim processamos upload
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() foto: Express.Multer.File,
  ): Promise<{ path: string }> {
    const path = await this.pessoasService.savePhoto(id, foto);
    return { path };
  }

  /** Lista URLs de todas as fotos */
  @Get(':id/fotos')
  listPhotos(@Param('id', ParseUUIDPipe) id: string): Promise<string[]> {
    return this.pessoasService.listPhotos(id);
  }

  /** Retorna URL da foto mais recente */
  @Get(':id/fotos/latest')
  async latestPhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ path: string }> {
    const path = await this.pessoasService.getLatestPhoto(id);
    if (!path) throw new NotFoundException('Nenhuma foto encontrada');
    return { path };
  }
}
