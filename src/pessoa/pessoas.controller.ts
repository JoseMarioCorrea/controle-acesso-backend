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

  /**
   * Cria pessoa (base) sem integração síncrona
   */
  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  create(
    @Body() dto: CreatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    return this.pessoasService.createBase(dto, foto?.filename);
  }

  /** Lista todas as pessoas com depto e grupos */
  @Get()
  findAll(): Promise<Pessoa[]> {
    return this.pessoasService.findAll();
  }

  /** Busca pessoa por ID */
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Pessoa> {
    return this.pessoasService.findById(id);
  }

  /** Atualiza pessoa (base) sem integração síncrona */
  @Put(':id')
  @UseInterceptors(FileInterceptor('foto'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    return this.pessoasService.updateBase(id, dto, foto?.filename);
  }

  /** Remove pessoa (base) */
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.pessoasService.removeBase(id);
  }

  /** Upload de foto */
  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('foto'))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() foto: Express.Multer.File,
  ): Promise<{ path: string }> {
    return this.pessoasService.savePhoto(id, foto)
      .then(path => ({ path }));
  }

  /** Lista URLs de todas as fotos */
  @Get(':id/fotos')
  listPhotos(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<string[]> {
    return this.pessoasService.listPhotos(id);
  }

  /** Retorna URL da foto mais recente */
  @Get(':id/fotos/latest')
  latestPhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ path: string }> {
    return this.pessoasService.getLatestPhoto(id)
      .then(path => {
        if (!path) throw new NotFoundException('Nenhuma foto encontrada');
        return { path };
      });
  }
}
