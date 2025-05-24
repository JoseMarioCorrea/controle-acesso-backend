import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IdfaceService } from './idface.service';
import { SetTimeDto } from './dto/set-time.dto';
import { SetNetworkDto } from './dto/set-network.dto';
import { SetVPNInfoDto } from './dto/set-vpn-info.dto';
import { UploadVpnFileDto } from './dto/upload-vpn-file.dto';
import { GpioStateDto } from './dto/gpio-state.dto';
import {
  SetUserAuthenticationDto,
  SetUserDeviceDto,
  SetUserGroupDto,
  SetUserAccessScheduleDto,
  DeleteUserDto,
} from './dto/user-config.dto';

@Controller('idface')
@UsePipes(new ValidationPipe({ whitelist: true }))
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
  setTime(@Body() body: SetTimeDto) {
    return this.idfaceService.setSystemTime(body.datetime);
  }

  @Post('network')
  setNetwork(@Body() config: SetNetworkDto) {
    return this.idfaceService.setNetwork(config);
  }

  @Post('vpn/config')
  setVPNInfo(@Body() info: SetVPNInfoDto) {
    return this.idfaceService.setVPNInfo(info);
  }

  @Post('vpn/upload-config')
  sendConfigFile(@Body() body: UploadVpnFileDto) {
    return this.idfaceService.sendVPNFile(body.file, 'config');
  }

  @Post('vpn/upload-zip')
  sendZipFile(@Body() body: UploadVpnFileDto) {
    return this.idfaceService.sendVPNFile(body.file, 'zip');
  }

  @Post('gpio')
  getGpioState(@Body() body: GpioStateDto) {
    return this.idfaceService.gpioState(body.gpio);
  }

  // --- Métodos com device_id ---

  @Post('user/authentication')
  setUserAuthentication(@Body() body: SetUserAuthenticationDto) {
    return this.idfaceService.setUserAuthentication(body);
  }

  @Post('user/device')
  setUserDevice(@Body() body: SetUserDeviceDto) {
    return this.idfaceService.setUserDevice(body);
  }

  @Post('user/group')
  setUserGroup(@Body() body: SetUserGroupDto) {
    return this.idfaceService.setUserGroup(body);
  }

  @Post('user/schedule')
  setUserAccessSchedule(@Body() body: SetUserAccessScheduleDto) {
    return this.idfaceService.setUserAccessSchedule(body);
  }

  @Post('user/delete')
  deleteUser(@Body() body: DeleteUserDto) {
    return this.idfaceService.deleteUser(body);
  }
}
