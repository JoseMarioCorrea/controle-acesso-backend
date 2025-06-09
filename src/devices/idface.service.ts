// src/idface/idface.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class IdfaceService {
  setUserAuthentication(id: number, arg1: number) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(IdfaceService.name);
  private session: string | undefined;

  constructor(private readonly http: HttpService) { }

  async ensureSession(login: string, password: string) {
    const resp = await firstValueFrom(
      this.http.post<{ session: string }>(
        '/login.fcgi',
        { login, password }
      )
    );
    this.session = resp.data.session;
    this.logger.log(`✔ Login: session=${this.session}`);
  }

  async login(login: string, password: string) {
    const resp = await firstValueFrom(
      this.http.post<{ session: string }>(
        '/login.fcgi',
        { login, password }
      )
    );
    this.session = resp.data.session;
    this.logger.log(`✔ Login: session=${this.session}`);
  }


  async logout() {
    await firstValueFrom(this.http.post(`/logout?session=${this.session}`, {}));
    this.logger.log(`✔ Logout session=${this.session}`);
    this.session = undefined;
  }

  async validateSession() {
    await this.ensureSession('admin', 'admin');
    const resp = await firstValueFrom(this.http.get<{ valid: boolean }>(`/session/valid?session=${this.session}`));
    return { valid: resp.data.valid };
  }


  /** ————— Dispositivo ————— (ficam iguais) */
  async reboot() { await firstValueFrom(this.http.post(`/reboot?session=${this.session}`, {})); }
  async factoryReset() { await firstValueFrom(this.http.post(`/factory-reset?session=${this.session}`, {})); }
  async setDateTime(datetime: string) {
    await firstValueFrom(this.http.post(`/time?session=${this.session}`, { datetime }));
  }
  async configureNetwork(cfg: any) {
    await firstValueFrom(this.http.post(`/network?session=${this.session}`, cfg));
  }
  // ... vpn, gpio etc ...

  /** ————— Usuários via FCGI ————— */
  async createUserOnDevice(
    name: string,
    registration: string = '',
    password: string = '',
    salt: string = ''
  ): Promise<void> {
    await this.ensureSession('admin', 'admin');
    const url = `/create_objects.fcgi?session=${this.session}`;
    const body = {
      object: 'users',
      values: [
        { name, registration, password, salt }
      ]
    };
    await firstValueFrom(this.http.post(url, body, {
      headers: { 'Content-Type': 'application/json' }
    }));
    this.logger.log(`✔ Criado user "${name}" no iDFace`);
  }

  async uploadUserPhoto(image: Buffer, userId: number): Promise<any> {
    await this.ensureSession('admin', 'admin');

    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    const url = `/user_set_image.fcgi?user_id=${userId}&timestamp=${timestamp}&match=0&session=${this.session}`;

    const response = await firstValueFrom(this.http.post(url, image, {
      headers: { 'Content-Type': 'application/octet-stream' },
      responseType: 'json'
    }));

    const data = response.data;

    if (!data.success) {
      this.logger.warn(`❌ Erro ao cadastrar foto do user_id=${userId}`, JSON.stringify(data.errors));
      throw new BadRequestException({ message: 'Erro ao cadastrar foto', detalhes: data.errors });
    }

    this.logger.log(`✔ Foto cadastrada com sucesso para user_id=${userId}`);
    return data;
  }

  async updateUserOnDevice(
    id: number,
    fields: Record<string, any>
  ): Promise<void> {
    await this.ensureSession('admin', 'admin');
    const url = `/modify_objects.fcgi?session=${this.session}`;
    const body = {
      object: 'users',
      values: fields,
      where: { users: { id } }
    };
    await firstValueFrom(this.http.post(url, body, {
      headers: { 'Content-Type': 'application/json' }
    }));
    this.logger.log(`✔ Atualizado user id=${id} no iDFace`);
  }

  async deleteUserFromDevice(id: number): Promise<void> {
    await this.ensureSession('admin', 'admin');
    const url = `/destroy_objects.fcgi?session=${this.session}`;
    const body = {
      object: 'users',
      where: { users: { id } }
    };
    await firstValueFrom(this.http.post(url, body, {
      headers: { 'Content-Type': 'application/json' }
    }));
    this.logger.log(`✔ Deletado user id=${id} no iDFace`);
  }
}
function dayjs() {
  throw new Error('Function not implemented.');
}

