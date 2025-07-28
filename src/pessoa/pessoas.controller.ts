// src/pessoa/pessoas.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  constructor(private readonly pessoasService: PessoasService) { }

  /* -------------------------------------------------------------- */
  /* CREATE                                                         */
  /* -------------------------------------------------------------- */
  @Post()
  create(@Body() dto: CreatePessoaDto): Promise<Pessoa> {
    return this.pessoasService.createBase(dto);
  }

  /* -------------------------------------------------------------- */
  /* LIST  ( ?visitante=true|false )                                */
  /* -------------------------------------------------------------- */
  @Get()
  findAll(@Query('visitante') visitante?: 'true' | 'false'): Promise<Pessoa[]> {
    const flag =
      visitante === undefined ? undefined : visitante === 'true';
    return this.pessoasService.findAll(flag); // ← service aceita filtro opcional
  }

  /* -------------------------------------------------------------- */
  /* GET BY ID                                                      */
  /* -------------------------------------------------------------- */
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<Pessoa> {
    return this.pessoasService.findById(id);
  }

  /* -------------------------------------------------------------- */
  /* UPDATE                                                         */
  /* -------------------------------------------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePessoaDto,
  ): Promise<Pessoa> {
    return this.pessoasService.updateBase(id, dto);
  }

  /* -------------------------------------------------------------- */
  /* DELETE                                                         */
  /* -------------------------------------------------------------- */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.pessoasService.removeBase(id);
  }

  /* -------------------------------------------------------------- */
  /* PHOTO UPLOAD / LIST / LATEST                                   */
  /* -------------------------------------------------------------- */
  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('foto'))
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() foto: Express.Multer.File,
  ): Promise<{ path: string }> {
    const path = await this.pessoasService.savePhoto(id, foto);
    return { path };
  }

  @Get(':id/fotos')
  listPhotos(@Param('id', ParseUUIDPipe) id: string): Promise<string[]> {
    return this.pessoasService.listPhotos(id);
  }

  @Get(':id/fotos/latest')
  async latestPhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ path: string }> {
    const path = await this.pessoasService.getLatestPhoto(id);
    if (!path) throw new NotFoundException('Nenhuma foto encontrada');
    return { path };
  }
}
