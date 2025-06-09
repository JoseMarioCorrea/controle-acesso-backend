// src/idface/idface.controller.ts
import {
  Controller, Post, Put, Delete, Body, Param, ParseIntPipe,
  UsePipes, ValidationPipe,
  Get,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { IdfaceService } from './idface.service';
import { FileInterceptor } from '@nestjs/platform-express';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('idface')
export class IdfaceController {
  constructor(private readonly idface: IdfaceService) { }

  // ————— Sessão / Dispositivo ————— (permanece)
  @Post('login')
  login(
    @Body('login') login: string,
    @Body('password') password: string
  ) {
    return this.idface.login(login, password);
  }
  @Post('logout') logout() { return this.idface.logout(); }
  @Get('session/valid') valid() { return this.idface.validateSession(); }
  @Post('reboot') reboot() { return this.idface.reboot(); }
  @Post('factory-reset') factory() { return this.idface.factoryReset(); }
  @Post('time') time(@Body('datetime') dt: string) {
    return this.idface.setDateTime(dt);
  }
  @Post('network') network(@Body() cfg: any) {
    return this.idface.configureNetwork(cfg);
  }
  // ... vpn, gpio etc ...

  // ————— Usuários FCGI —————
  @Post('users')
  async createUser(
    @Body('name') name: string,
    @Body('registration') registration?: string,
    @Body('password') password?: string,
    @Body('salt') salt?: string,
  ) {
    const userId = await this.idface.createUserOnDevice(
      name,
      registration ?? '',
      password ?? '',
      salt ?? ''
    );

    return { userId }; // << aqui retorna o ID para o frontend
  }

  @Put('users/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() fields: Record<string, any>
  ) {
    return this.idface.updateUserOnDevice(id, fields);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.idface.deleteUserFromDevice(id);
  }

  @Post('foto')
  @UseInterceptors(FileInterceptor('foto'))
  uploadFoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('user_id', ParseIntPipe) userId: number
  ) {
    return this.idface.uploadUserPhoto(file.buffer, userId);
  }

}
