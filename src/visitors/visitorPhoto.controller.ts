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
  constructor(private readonly photoSvc: VisitorPhotoService) { }

  /** ­POST /uploads/visitors/:id  (campo FormData **foto**) */
  @Post(':visitorId')
  @UseInterceptors(FileInterceptor('foto'))
  async upload(
    @Param('visitorId', ParseIntPipe) visitorId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    const path = await this.photoSvc.savePhoto(visitorId, file);
    return { path };
  }

  @Get(':visitorId/latest')
  async latest(
    @Param('visitorId', ParseIntPipe) visitorId: number,
  ): Promise<{ path: string }> {
    const path = await this.photoSvc.getLatest(visitorId);
    if (!path) throw new NotFoundException('Nenhuma foto encontrada');
    return { path };
  }

  /** ­GET /uploads/visitors/:id  → lista nomes de arquivos */
  @Get(':id')
  async list(@Param('id', ParseIntPipe) id: number) {
    return this.photoSvc.listPhotos(id);
  }

}
