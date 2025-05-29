// src/devices/idface.controller.ts
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

  // --- Métodos de configuração de usuário ---

 /* @Post('user/authentication')
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
  }*/

  // --- Novos endpoints para criação de objetos ---

  @Post('user/create')
  createUser(@Body() body: { name: string; registration?: string; password?: string; salt?: string }) {
    return this.idfaceService.createUser(body);
  }

  @Post('group/create')
  createGroup(@Body() body: { name: string }) {
    return this.idfaceService.createGroup(body.name);
  }

  @Post('user-group/create')
  createUserGroup(@Body() body: { user_id: number; group_id: number }) {
    return this.idfaceService.createUserGroup(body.user_id, body.group_id);
  }

  @Post('user-group/load')
  loadUserGroup(@Body() body: { user_id: number; group_id: number }) {
    return this.idfaceService.loadUserGroup(body.user_id, body.group_id);
  }

  @Post('access-rule/create')
  createAccessRule(@Body() body: { name: string }) {
    return this.idfaceService.createAccessRule(body.name);
  }

  @Post('group-access-rule/create')
  createGroupAccessRule(@Body() body: { group_id: number; access_rule_id: number }) {
    return this.idfaceService.createGroupAccessRule(body.group_id, body.access_rule_id);
  }

  @Post('time-zone/create')
  createTimeZone(@Body() body: { name: string }) {
    return this.idfaceService.createTimeZone(body.name);
  }

  @Post('time-span/create')
  createTimeSpan(@Body() body: {
    time_zone_id: number;
    start: number;
    end: number;
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    hol1: number;
    hol2: number;
    hol3: number;
  }) {
    return this.idfaceService.createTimeSpan(body);
  }

  @Post('access-rule-time-zone/create')
  createAccessRuleTimeZone(@Body() body: { access_rule_id: number; time_zone_id: number }) {
    return this.idfaceService.createAccessRuleTimeZone(body.access_rule_id, body.time_zone_id);
  }
}
