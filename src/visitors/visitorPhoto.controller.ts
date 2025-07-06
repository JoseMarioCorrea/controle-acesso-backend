// src/shared/storage/visitor-photo.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisitorPhotoService } from './visitorPhoto.service';

/**
 * End-points responsáveis por **upload** e **consulta**
 * de fotos de visitantes gravadas em disco.
 *
 * Rotas:
 *  ▸ POST /uploads/visitors/:id        — salva imagem (campo `foto`)
 *  ▸ GET  /uploads/visitors/:id        — lista arquivos desse visitante
 *  ▸ GET  /uploads/visitors/:id/latest — devolve a foto mais recente
 */
@Controller('uploads/visitors')
export class VisitorPhotoController {
  constructor(private readonly photoSvc: VisitorPhotoService) {}

  /** ­POST /uploads/visitors/:id  (campo FormData **foto**) */
  @Post(':id')
  @UseInterceptors(FileInterceptor('foto'))
  async upload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const path = await this.photoSvc.savePhoto(id, file);
    return { path }; // →  { "path": "/uploads/visitors/42/170000000-xxxx.jpg" }
  }

  /** ­GET /uploads/visitors/:id  → lista nomes de arquivos */
  @Get(':id')
  async list(@Param('id', ParseIntPipe) id: number) {
    return this.photoSvc.listPhotos(id);
  }

  /** ­GET /uploads/visitors/:id/latest  → foto mais recente */
  @Get(':id/latest')
  async latest(@Param('id', ParseIntPipe) id: number) {
    const photo = await this.photoSvc.getLatest(id);
    if (!photo) throw new NotFoundException('Nenhuma foto encontrada');
    return { path: photo };
  }
}
