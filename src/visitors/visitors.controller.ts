// src/visitors/visitors.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisitorsService } from './visitors.service';
import { Visitante } from './visitor.entity';
import { CreateVisitorDto } from './dto/create-visitors.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { memoryStorage } from 'multer';

@Controller('visitors')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) { }

  /** Criar visitante (base) */
  @Post()
  create(
    @Body() dto: CreateVisitorDto,
  ): Promise<Visitante> {
    return this.visitorsService.createBase(dto);
  }

  /** Listar todos visitantes */
  @Get()
  findAll(): Promise<Visitante[]> {
    return this.visitorsService.findAll();
  }

  /** Buscar visitante por ID */
  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Visitante> {
    return this.visitorsService.findById(id);
  }

  /** Atualizar visitante (base) */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisitorDto,
  ): Promise<Visitante> {
    return this.visitorsService.updateBase(id, dto);
  }

  /** Remover visitante (base) */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.visitorsService.removeBase(id);
  }

  /** Upload de foto de visitante */
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const path = await this.visitorsService.savePhoto(id, file);
    return { path };
  }

  /** Listar URLs de fotos */
  @Get(':id/photos')
  listPhotos(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<string[]> {
    return this.visitorsService.listPhotos(id);
  }

  /** URL da foto mais recente */
  @Get(':id/photos/latest')
  async latestPhoto(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const path = await this.visitorsService.getLatestPhoto(id);
    if (!path) throw new NotFoundException('Nenhuma foto encontrada');
    return { path };
  }

  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('foto', { storage: memoryStorage() }))
  async uploadFoto(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    const path = await this.visitorsService.savePhoto(id, file);
    return { path };
  }

}
