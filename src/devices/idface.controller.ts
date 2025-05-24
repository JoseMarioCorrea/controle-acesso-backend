import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { IdfaceService } from './idface.service';

@Controller('idface')
export class IdfaceController {
  constructor(private readonly idfaceService: IdfaceService) {}

  @Post('login')
  login() {
    return this.idfaceService.login();
  }

  @Post('logout')
  logout() {
    return this.idfaceService.logout();
  }

  @Get('session/valid')
  sessionIsValid() {
    return this.idfaceService.sessionIsValid();
  }

  @Post('reboot')
  reboot() {
    return this.idfaceService.reboot();
  }

  @Post('factory-reset')
  factoryReset() {
    return this.idfaceService.factoryReset();
  }

  @Post('time')
  setTime(@Body('datetime') datetime: string) {
    if (!datetime) throw new BadRequestException('datetime é obrigatório');
    return this.idfaceService.setSystemTime(datetime);
  }

  @Post('network')
  setNetwork(@Body() config: {
    ip: string;
    mask: string;
    gateway: string;
    dns: string;
    hostname: string;
  }) {
    return this.idfaceService.setNetwork(config);
  }

  @Post('vpn/config')
  setVPNInfo(@Body() info: {
    server: string;
    port: number;
    proto: string;
    username: string;
    password: string;
  }) {
    return this.idfaceService.setVPNInfo(info);
  }

  @Post('vpn/upload-config')
  sendConfigFile(@Body('file') file: string) {
    if (!file) throw new BadRequestException('Arquivo em base64 é obrigatório');
    return this.idfaceService.sendVPNFile(file, 'config');
  }

  @Post('vpn/upload-zip')
  sendZipFile(@Body('file') file: string) {
    if (!file) throw new BadRequestException('Arquivo em base64 é obrigatório');
    return this.idfaceService.sendVPNFile(file, 'zip');
  }

  @Post('gpio')
  getGpioState() {
    return this.idfaceService.gpioState();
  }
}
