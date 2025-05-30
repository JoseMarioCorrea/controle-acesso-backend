import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class IdfaceService {
  [x: string]: any;
  private client: AxiosInstance;
  private session: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.IDFACE_BASE_URL || 'http://192.168.18.63',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private resolveDeviceId(device_id?: number): number {
    return device_id ?? parseInt(process.env.IDFACE_DEVICE_ID || '1', 10);
  }

  async login(): Promise<string> {
    const res = await this.client.post('/login.fcgi', {
      login: process.env.IDFACE_USER || 'admin',
      password: process.env.IDFACE_PASS || 'admin',
    });

    if (res.data?.session) {
      this.session = res.data.session;
      return this.session as string;
    }

    throw new HttpException('Falha ao autenticar com o iDFace', HttpStatus.UNAUTHORIZED);
  }

  async logout(): Promise<void> {
    if (!this.session) await this.login();
    await this.client.post(`/logout.fcgi?session=${this.session}`);
    this.session = null;
  }

  async sessionIsValid(): Promise<boolean> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/session_is_valid.fcgi?session=${this.session}`);
    return res.data?.success === true;
  }

  async reboot(): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/reboot.fcgi?session=${this.session}`);
    return res.data;
  }

  async factoryReset(): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/reset_to_factory_default.fcgi?session=${this.session}`);
    return res.data;
  }

  async setSystemTime(datetimeISO: string): Promise<any> {
    if (!this.session) await this.login();
    const dt = new Date(datetimeISO);
    const payload = {
      day: dt.getUTCDate(),
      month: dt.getUTCMonth() + 1,
      year: dt.getUTCFullYear(),
      hour: dt.getUTCHours(),
      minute: dt.getUTCMinutes(),
      second: dt.getUTCSeconds(),
    };
    const res = await this.client.post(`/set_system_time.fcgi?session=${this.session}`, payload);
    return res.data;
  }

  async setNetwork(config: {
    ip: string;
    netmask: string;
    gateway: string;
    dns: string;
    hostname: string;
  }): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/set_system_network.fcgi?session=${this.session}`, config);
    return res.data;
  }

  async setVPNInfo(info: {
    server: string;
    port: number;
    proto: string;
    username: string;
    password: string;
  }): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/set_vpn_information.fcgi?session=${this.session}`, info);
    return res.data;
  }

  async sendVPNFile(fileBase64: string, fileType: 'zip' | 'config'): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(
      `/set_vpn_file.fcgi?session=${this.session}&file_type=${fileType}`,
      { file: fileBase64 }
    );
    return res.data;
  }

  async gpioState(gpio: number = 11): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/gpio_state.fcgi?session=${this.session}`, { gpio });
    return res.data;
  }

  async createObject(object: string, values: any[]): Promise<any> {
    if (!this.session) await this.login();
    const payload = { object, values };
    return (await this.client.post(`/create_objects.fcgi?session=${this.session}`, payload)).data;
  }

  async createUser(user: {
    name: string;
    registration?: string;
    password?: string;
    salt?: string;
  }): Promise<any> {
    if (!this.session) await this.login();

    const payload = {
      object: 'users',
      values: [
        {
          name: user.name,
          registration: user.registration ?? '',
          password: user.password ?? '',
          salt: user.salt ?? ''
        }
      ]
    };

    console.log('Enviando payload de createUser:', payload);

    const res = await this.client.post(`/create_objects.fcgi?session=${this.session}`, payload);
    return res.data;
  }

  async createGroup(name: string): Promise<any> {
    return this.createObject('groups', [{ name }]);
  }

  async loadGroup(name: string): Promise<any> {
    return this.createObject('groups', [{ name }]);
  }

  async createUserGroup(user_id: number, group_id: number): Promise<any> {
    console.log(`TESTE ${user_id} ${group_id}`);

    if (!user_id || !group_id) {
      throw new HttpException('Parâmetros user_id e group_id são obrigatórios', HttpStatus.BAD_REQUEST);
    }

    return this.createObject('user_groups', [
      { user_id, group_id }
    ]);
  }

  async createAccessRule(name: string): Promise<any> {
    return this.createObject('access_rules', [{
      name,
      type: 1,        // tipo padrão (1 = acesso liberado)
      priority: 0     // prioridade padrão
    }]);
  }


  async createGroupAccessRule(group_id: number, access_rule_id: number): Promise<any> {
    return this.createObject('group_access_rules', [{ group_id, access_rule_id }]);
  }

  async createTimeZone(name: string): Promise<any> {
    return this.createObject('time_zones', [{ name }]);
  }

  async createTimeSpan(
    data: {
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
    }): Promise<any> {
    return this.createObject('time_spans', [data]);
  }

  async createAccessRuleTimeZone(access_rule_id: number, time_zone_id: number): Promise<any> {
    return this.createObject('access_rule_time_zones', [{ access_rule_id, time_zone_id }]);
  }

  async deleteUser(data: {
    user_id: number;
    device_id?: number;
  }): Promise<any> {
    if (!this.session) await this.login();
    const payload = {
      user_id: data.user_id,
      device_id: this.resolveDeviceId(data.device_id),
    };
    const res = await this.client.post(`/delete_user.fcgi?session=${this.session}`, payload);
    return res.data;
  }
  async deleteUserIdface(user_id: number): Promise<void> {
    await this.login();

    // 1. Exclui foto facial vinculada
    await this.client.post(`/user_destroy_image.fcgi?session=${this.session}`, {
      user_id,
    });

    // 2. Exclui objeto do tipo user
    await this.client.post(`/destroy_objects.fcgi?session=${this.session}`, {
      object: 'users',
      values: [{ id: user_id }]
    });
  }

  async setUserAuthentication(data: {
    user_id: number;
    auth_mode: number;
    device_id?: number;
  }): Promise<any> {
    if (!this.session) await this.login();
    const payload = {
      user_id: data.user_id,
      auth_mode: data.auth_mode,
      device_id: this.resolveDeviceId(data.device_id),
    };
    const res = await this.client.post(`/set_user_authentication.fcgi?session=${this.session}`, payload);
    return res.data;
  }

  async setUserDevice(data: {
    user_id: number;
    device_id?: number;
  }): Promise<any> {
    if (!this.session) await this.login();
    const payload = {
      user_id: data.user_id,
      device_id: this.resolveDeviceId(data.device_id),
    };
    const res = await this.client.post(`/set_user_device.fcgi?session=${this.session}`, payload);
    return res.data;
  }

  async setUserGroup(data: {
    user_id: number;
    group_id: number;
  }): Promise<any> {
    if (!this.session) await this.login();
    if (!data.user_id || !data.group_id) {
      throw new HttpException('Parâmetros user_id e group_id são obrigatórios', HttpStatus.BAD_REQUEST);
    }
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
    };
    const res = await this.client.post(`/set_user_group.fcgi?session=${this.session}`, payload);
    return res.data;
  }

  async setUserAccessSchedule(data: {
    user_id: number;
    schedule_id: number;
    device_id?: number;
  }): Promise<any> {
    if (!this.session) await this.login();
    const payload = {
      user_id: data.user_id,
      schedule_id: data.schedule_id,
      device_id: this.resolveDeviceId(data.device_id),
    };
    const res = await this.client.post(`/set_user_access_schedule.fcgi?session=${this.session}`, payload);
    return res.data;
  }

  async setUserImage(user_id: number, foto: Express.Multer.File): Promise<any> {

    const res = await this.client.post(
      `/user_set_image.fcgi?session=${this.session}&user_id=${user_id}`,
      foto.buffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      },
    );
    return res.data;
  }

  async updateUserImage(user_id: number, imageBuffer: Buffer): Promise<any> {
    if (!this.session) await this.login();
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    const res = await this.client.post(
      `/user_set_image.fcgi?session=${this.session}&user_id=${user_id}&timestamp=${timestamp}&match=0`,
      imageBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      },
    );

    if (res.data?.success === false) {
      const reasons = res.data.errors?.map((e: any) => `(${e.code}) ${e.message}`).join('; ');
      throw new Error(`Falha ao cadastrar imagem do usuário ${user_id}: ${reasons}`);
    }

    return res.data;
  }


}
