// src/idface/idface.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { delay, firstValueFrom } from 'rxjs';
import { TerminalsService } from 'src/terminals/terminals.service';

@Injectable()
export class IdfaceService {
  [x: string]: any;
  private readonly logger = new Logger(IdfaceService.name);
  private sessions: Record<number, string> = {};

  constructor(
    private readonly http: HttpService,
    private readonly terminalService: TerminalsService
  ) { }

  private async getHttp(terminalId: number) {
    const terminal = await this.terminalService.findById(terminalId);
    const baseURL = `http://${terminal.host}:${terminal.port}`;
    return this.http.axiosRef.create({ baseURL });
  }

  private async ensureSession(terminalId: number, login = 'admin', password = 'admin') {
    const http = await this.getHttp(terminalId);
    const resp = await http.post('/login.fcgi', { login, password });
    this.sessions[terminalId] = resp.data.session;
    this.logger.log(`✔ Login terminal ${terminalId}: session=${resp.data.session}`);
  }

  async login(terminalId: number, login: string, password: string) {
    await this.ensureSession(terminalId, login, password);
    return { session: this.sessions[terminalId] };
  }

  async logout(terminalId: number) {
    const http = await this.getHttp(terminalId);
    await http.post(`/logout?session=${this.sessions[terminalId]}`, {});
    this.logger.log(`✔ Logout terminal ${terminalId}`);
    delete this.sessions[terminalId];
  }

  async validateSession(terminalId: number) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const resp = await http.get(`/session/valid?session=${this.sessions[terminalId]}`);
    return { valid: resp.data.valid };
  }

  async liberarAcesso(terminalId: number, userId: string): Promise<void> {
    const client = this.getClientForTerminal(terminalId);
    const res = await client.post(`/liberar_acesso.cgi`, { user_id: userId });
    if (!res.data.success) {
      throw new Error(`Falha ao liberar acesso para usuário ${userId}`);
    }
  }

  async releaseUserOnDevice(terminalId: number, userId: number, name: string): Promise<void> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'access_rules',
      values: [{ name: name, type: 1, priority: 1 }],
    };
    const response = await http.post(url, body);
    if (response.data?.ids?.length !== 1) {
      throw new Error('Erro ao liberar usuário no dispositivo');
    }
    this.logger.log(`✔ Usuário ${userId} liberado no terminal ${terminalId}`);
  }


  async reboot(terminalId: number) {
    const http = await this.getHttp(terminalId);
    await http.post(`/reboot?session=${this.sessions[terminalId]}`, {});
  }

  async factoryReset(terminalId: number) {
    const http = await this.getHttp(terminalId);
    await http.post(`/factory-reset?session=${this.sessions[terminalId]}`, {});
  }

  async setDateTime(terminalId: number, datetime: string) {
    const http = await this.getHttp(terminalId);
    await http.post(`/time?session=${this.sessions[terminalId]}`, { datetime });
  }

  async configureNetwork(terminalId: number, cfg: any) {
    const http = await this.getHttp(terminalId);
    await http.post(`/network?session=${this.sessions[terminalId]}`, cfg);
  }

  async createUserOnDevice(terminalId: number, name: string, registration = '', password = '', salt = ''): Promise<number> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      values: [{ name, registration, password, salt }],
    };
    const response = await http.post(url, body);
    const userId = response.data?.ids?.[0];

    if (!userId || typeof userId !== 'number') {
      throw new BadRequestException('Erro ao criar usuário no iDFace');
    }

    this.logger.log(`✔ Usuário criado: id=${userId} no terminal ${terminalId}`);

    // Confirma se o usuário foi salvo corretamente antes de seguir
    const confirmado = await this.confirmUserExists(terminalId, userId);
    if (!confirmado) {
      throw new BadRequestException(`Usuário ${userId} não confirmado no terminal ${terminalId}`);
    }

    // Liberação de acesso
    await this.releaseUserOnDevice(terminalId, userId, name);

    return userId;
  }
  async confirmUserExists(terminalId: number, userId: number): Promise<boolean> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      where: { users: { id: userId } }
    };
    const response = await http.post(url, body);
    return response.data?.objects?.length > 0;
  }

  async loadUserById(terminalId: number, userId: number) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      where: { users: { id: userId } },
    };
    const response = await http.post(url, body);
    return response.data.objects?.[0] ?? null;
  }

  async uploadUserPhoto(terminalId: number, image: Buffer, userId: number): Promise<any> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `/user_set_image.fcgi?user_id=${userId}&timestamp=${timestamp}&match=0&session=${this.sessions[terminalId]}`;
    const response = await http.post(url, image, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    if (!response.data?.success) {
      throw new BadRequestException({ message: 'Erro ao cadastrar foto' });
    }
    this.logger.log(`✔ Foto cadastrada para user_id=${userId} no terminal ${terminalId}`);
    return response.data;
  }

  async updateUserOnDevice(terminalId: number, id: number, fields: Record<string, any>) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/modify_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      values: fields,
      where: { users: { id } },
    };
    await http.post(url, body);
    this.logger.log(`✔ Atualizado user id=${id} no terminal ${terminalId}`);
  }

  async deleteUserFromDevice(terminalId: number, id: number) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/destroy_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      where: { users: { id } },
    };
    await http.post(url, body);
    this.logger.log(`✔ Deletado user id=${id} no terminal ${terminalId}`);
  }

  async assignUserToGroup(terminalId: number, userId: number, groupId: number) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'user_groups',
      values: [{ user_id: userId, group_id: groupId }],
    };
    const response = await http.post(url, body);
    if (!response.data?.ids?.length) {
      throw new BadRequestException('Falha ao vincular usuário ao grupo');
    }
    this.logger.log(`✔ user_id=${userId} associado ao group_id=${groupId} no terminal ${terminalId}`);
  }
}
