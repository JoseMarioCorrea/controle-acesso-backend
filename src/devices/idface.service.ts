
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class IdfaceService {
  private client: AxiosInstance;
  private session: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.IDFACE_BASE_URL || 'http://192.168.0.100',
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: process.env.IDFACE_USER || 'admin',
        password: process.env.IDFACE_PASS || 'admin',
      },
    });
  }

  async login(): Promise<string> {
    const res = await this.client.post('/login.fcgi');
    if (res.data?.session) {
      this.session = res.data.session;
      return this.session?? 'error';
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
    const res = await this.client.post('/session_is_valid.fcgi', {
      session: this.session,
    });
    return res.data?.success === true;
  }

  async reboot(): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post('/reboot.fcgi', {
      session: this.session,
    });
    return res.data;
  }

  async factoryReset(): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post('/reset_to_factory_default.fcgi', {
      session: this.session,
    });
    return res.data;
  }

  async setSystemTime(date: string): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post('/set_system_time.fcgi', {
      session: this.session,
      datetime: date,
    });
    return res.data;
  }

  async setNetwork(config: {
    ip: string;
    mask: string;
    gateway: string;
    dns: string;
    hostname: string;
  }): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post('/set_system_network.fcgi', {
      session: this.session,
      ...config,
    });
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
    const res = await this.client.post('/set_vpn_information.fcgi', {
      session: this.session,
      ...info,
    });
    return res.data;
  }

  async sendVPNFile(fileBase64: string, fileType: 'zip' | 'config'): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post(`/set_vpn_file.fcgi?session=${this.session}&file_type=${fileType}`, {
      file: fileBase64,
    });
    return res.data;
  }

  async gpioState(): Promise<any> {
    if (!this.session) await this.login();
    const res = await this.client.post('/gpio_state.fcgi', {
      session: this.session,
    });
    return res.data;
  }
}
