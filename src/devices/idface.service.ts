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
    private readonly terminalService: TerminalsService,
  ) {}

  private async getHttp(terminalId: number) {
    const terminal = await this.terminalService.findById(terminalId);
    const baseURL = `http://${terminal.host}:${terminal.port}`;
    return this.http.axiosRef.create({ baseURL });
  }

  private async ensureSession(
    terminalId: number,
    login = 'admin',
    password = 'admin',
  ) {
    const http = await this.getHttp(terminalId);
    const resp = await http.post('/login.fcgi', { login, password });
    this.sessions[terminalId] = resp.data.session;
    this.logger.log(
      `✔ Login terminal ${terminalId}: session=${resp.data.session}`,
    );
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
    const resp = await http.get(
      `/session/valid?session=${this.sessions[terminalId]}`,
    );
    return { valid: resp.data.valid };
  }

  async liberarAcesso(terminalId: number, userId: string): Promise<void> {
    const client = this.getClientForTerminal(terminalId);
    const res = await client.post(`/liberar_acesso.cgi`, { user_id: userId });
    if (!res.data.success) {
      throw new Error(`Falha ao liberar acesso para usuário ${userId}`);
    }
  }

  async modifyObjects(
    terminalId: number,
    payload: {
      object: string;
      values: Record<string, any>;
      where: Record<string, any>;
    },
  ) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    await http.post(
      `/modify_objects.fcgi?session=${this.sessions[terminalId]}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  async releaseUserOnDevice(
    terminalId: number,
    userId: number,
    name: string,
    defaultGroupId = 1, // ID do grupo padrão
  ): Promise<void> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);

    // 1. Criar regra de acesso
    const ruleUrl = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
    const ruleBody = {
      object: 'access_rules',
      values: [{ name: name, type: 1, priority: 0 }],
    };
    const ruleResp = await http.post(ruleUrl, ruleBody);
    const accessRuleId = ruleResp.data?.ids?.[0];

    if (!accessRuleId) {
      throw new Error('Erro ao criar regra de acesso');
    }

    // 2. Associar usuário à regra
    const userAccessBody = {
      object: 'user_access_rules',
      values: [{ user_id: userId, access_rule_id: accessRuleId }],
    };
    const userAccessResp = await http.post(ruleUrl, userAccessBody);
    if (!userAccessResp.data?.ids?.length) {
      throw new Error('Erro ao associar usuário à regra de acesso');
    }

    // 3. Associar usuário ao grupo (departamento)
    const userGroupBody = {
      object: 'user_groups',
      values: [{ user_id: userId, group_id: defaultGroupId }],
    };
    const userGroupResp = await http.post(ruleUrl, userGroupBody);
    if (!userGroupResp.data?.ids?.length) {
      throw new Error('Erro ao associar usuário ao grupo padrão');
    }

    // 4. Forçar recarga opcional
    await http.post(`/load_objects.fcgi?session=${this.sessions[terminalId]}`, {
      object: 'user_access_rules',
    });
    await http.post(`/load_objects.fcgi?session=${this.sessions[terminalId]}`, {
      object: 'user_groups',
    });
    await http.post(`/load_objects.fcgi?session=${this.sessions[terminalId]}`, {
      object: 'access_rules',
    });

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

  async createUserOnDevice(
    terminalId: number,
    name: string,
    registration = '',
    password = '',
    salt = '',
  ): Promise<number> {
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

    this.logger.log(
      `✔ Usuário criado: id=${userId} no terminal ${terminalId}`,
    );

    // Confirma se o usuário foi salvo corretamente antes de seguir
    // Liberação de acesso
    await this.releaseUserOnDevice(terminalId, userId, name);

    return userId;
  }
  async confirmUserExists(
    terminalId: number,
    userId: number,
  ): Promise<boolean> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      where: { users: { id: userId } },
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

  async uploadUserPhoto(
    terminalId: number,
    image: Buffer,
    userId: number,
  ): Promise<any> {
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
    this.logger.log(
      `✔ Foto cadastrada para user_id=${userId} no terminal ${terminalId}`,
    );
    return response.data;
  }

  async updateUserOnDevice(
    terminalId: number,
    id: number,
    fields: Record<string, any>,
  ) {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/modify_objects.fcgi?session=${this.sessions[terminalId]}`;
    const body = {
      object: 'users',
      values: fields,
      where: { users: { id } },
    };
    await http.put(url, body);
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
    this.logger.log(
      `✔ user_id=${userId} associado ao group_id=${groupId} no terminal ${terminalId}`,
    );
  }

  async testUserImage(terminalId: number, image: Buffer): Promise<any> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);

    const session = this.sessions[terminalId];
    const url = `/user_test_image.fcgi?session=${session}`;

    const response = await http.post(url, image, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    return response.data;
  }
  async getLastUserId(terminalId: number): Promise<number> {
    await this.ensureSession(terminalId);
    const http = await this.getHttp(terminalId);
    const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;

    const body = {
      object: 'users',
    };

    const response = await http.post(url, body);

    return response.data;
  }
}
