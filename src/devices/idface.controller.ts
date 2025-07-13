// src/devices/idface.controller.ts
import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IdfaceService } from './idface.service';

@Controller('idface')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class IdfaceController {
  constructor(private readonly idface: IdfaceService) {}

  /**
   * Cria vários usuários no device
   */
  @Post(':deviceId/users/batch')
  createUsersBatch(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() users: Array<{ name: string; registration: string }>,
  ) {
    return this.idface.createUsersBatch(deviceId, users);
  }

  /**
   * Atualiza vários usuários no device
   */
  @Put(':deviceId/users/batch')
  updateUsersBatch(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() updates: Array<{ id: number; values: Record<string, any> }>,
  ) {
    return this.idface.updateUsersBatch(deviceId, updates);
  }

  /**
   * Carrega objetos do device
   */
  @Post(':deviceId/objects/load')
  loadObjects(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body('object') object: string,
    @Body('where') where?: Record<string, any>,
  ) {
    return this.idface.loadObjects(deviceId, object, where);
  }

  /**
   * Remove objetos do device
   */
  @Delete(':deviceId/objects')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteObjects(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body('object') object: string,
    @Body('where') where: Record<string, any>,
  ) {
    return this.idface.deleteObjects(deviceId, object, where);
  }

  /**
   * Upload de foto de usuário
   */
  @Post(':deviceId/users/:userId/photo')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  @HttpCode(HttpStatus.NO_CONTENT)
  uploadUserPhoto(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.idface.uploadUserPhoto(deviceId, userId, file.buffer);
  }

  /**
   * Teste de identificação facial
   */
  @Post(':deviceId/users/photo/test')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  testUserImage(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.idface.testUserImage(deviceId, file.buffer);
  }

  /**
   * Libera acesso para usuário no device
   */
  @Post(':deviceId/users/:userId/access')
  liberarAcesso(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.idface.liberarAcesso(deviceId, userId);
  }
}
