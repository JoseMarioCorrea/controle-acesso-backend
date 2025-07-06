// src/devices/idface.controller.ts
import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Get,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IdfaceService } from './idface.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('idface')
export class IdfaceController {
  constructor(private readonly idface: IdfaceService) { }

  @Post('login/:terminalId')
  login(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Body('login') login: string,
    @Body('password') password: string,
  ) {
    return this.idface.login(terminalId, login, password);
  }

  @Post('logout/:terminalId')
  logout(@Param('terminalId', ParseIntPipe) terminalId: number) {
    return this.idface.logout(terminalId);
  }

  @Get('session/valid/:terminalId')
  valid(@Param('terminalId', ParseIntPipe) terminalId: number) {
    return this.idface.validateSession(terminalId);
  }

  @Post('reboot/:terminalId')
  reboot(@Param('terminalId', ParseIntPipe) terminalId: number) {
    return this.idface.reboot(terminalId);
  }

  @Post('factory-reset/:terminalId')
  factory(@Param('terminalId', ParseIntPipe) terminalId: number) {
    return this.idface.factoryReset(terminalId);
  }

  @Post('time/:terminalId')
  time(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Body('datetime') dt: string,
  ) {
    return this.idface.setDateTime(terminalId, dt);
  }

  @Post('network/:terminalId')
  network(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Body() cfg: any,
  ) {
    return this.idface.configureNetwork(terminalId, cfg);
  }

  @Post('users/:terminalId')
  async createUser(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Body('name') name: string,
    @Body('registration') registration?: string,
    @Body('password') password?: string,
    @Body('salt') salt?: string,
  ) {
    const userId = await this.idface.createUserOnDevice(
      terminalId,
      name,
      registration ?? '',
      password ?? '',
      salt ?? '',
    );
    return { userId };
  }

  @Put('users/:terminalId/:id')
  updateUser(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() fields: Record<string, any>,
  ) {
    return this.idface.updateUserOnDevice(terminalId, id, fields);
  }

  @Delete('users/:terminalId/:id')
  deleteUser(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.idface.deleteUserFromDevice(terminalId, id);
  }

  @Get('users/:terminalId/:id')
  getUser(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.idface.loadUserById(terminalId, id); // precisa criar esse método
  }

  @Get('users/:terminalId/confirm/:userId')
  async confirmUserExists(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const exists = await this.idface.confirmUserExists(terminalId, userId);
    return { exists };
  }

  @Post('user_test_image/:terminalId')
  @UseInterceptors(FileInterceptor('foto'))
  testUserImage(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.idface.testUserImage(terminalId, file.buffer);
  }

  @Post('foto/:terminalId')
  @UseInterceptors(FileInterceptor('foto', {
    storage: memoryStorage(),
  }))
  uploadFoto(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('user_id', ParseIntPipe) userId: number,
  ) {
    return this.idface.uploadUserPhoto(terminalId, file.buffer, userId);
  }

  @Put('foto/:terminalId')
  @UseInterceptors(FileInterceptor('foto', {
    storage: memoryStorage(),
  }))
  reUploadFoto(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('user_id', ParseIntPipe) userId: number,
  ) {
    return this.idface.uploadUserPhoto(terminalId, file.buffer, userId);
  }


  @Put('users/:id/terminal/:terminalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserOnDevice(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() fields: Record<string, any>,
  ): Promise<void> {
    await this.idface.updateUserOnDevice(terminalId, id, fields);
  }


  @Post('users/:terminalId/:id/group/:groupId')
  assignUserToGroup(
    @Param('terminalId', ParseIntPipe) terminalId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.idface.assignUserToGroup(terminalId, userId, groupId);
  }

  @Get('users/:terminalId/last-id')
  getLastUserId(@Param('terminalId', ParseIntPipe) terminalId: number) {
    return this.idface
      .getLastUserId(terminalId)
      .then((id) => ({ lastUserId: id }));
  }
}
