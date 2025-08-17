import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from 'src/devices/idaface.entity';
import { CreateDeviceDto } from './dto/createDevice.dto';
import { UpdateDeviceDto } from './dto/updateDevice.dto';

type JSONObject = Record<string, any>;
type SessBag = { session: string; born: number; baseURL: string };

interface CreateUserBatchItem {
  name: string;
  registration: string;
}
interface UpdateUserBatchItem {
  id: number;
  values: Record<string, any>;
}
interface UploadPhotoOptions {
  timestamp?: number;  // unix (s)
  match?: 0 | 1;       // 0=rápido, 1=checa duplicidade
}

@Injectable()
export class IdfaceService {
  private readonly logger = new Logger(IdfaceService.name);

  // cache de sessão por device
  private sess: Record<number, SessBag> = {};
  private readonly sessionTtlMs = 30 * 60 * 1000; // 30min

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) { }

  /* =========================================================
   * Infra base (http, sessão e helpers)
   * =======================================================*/
  private enrichBadRequest(e: any, ctx: Record<string, any> = {}) {
    const status = e?.response?.status ?? 400;
    const data = e?.response?.data;
    const message = data?.error?.message || data?.error || e?.message || 'Bad Request';
    const err = new BadRequestException({ message, statusCode: status, details: data, ctx });
    (err as any).__nonTransient = true;
    return err;
  }

  private async getHttp(deviceId: number) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException(`Device ${deviceId} não encontrado`);
    const baseURL = `http://${device.ip}:${device.port}`;
    const http = this.httpService.axiosRef.create({ baseURL, timeout: 7000 });
    return { http, baseURL };
  }

  private sessionExpired(bag?: SessBag) {
    return !bag || (Date.now() - bag.born) > this.sessionTtlMs;
  }

  private async ensureSession(deviceId: number) {
    const { http, baseURL } = await this.getHttp(deviceId);
    const bag = this.sess[deviceId];

    // reloga se TTL venceu ou host mudou
    if (!bag || this.sessionExpired(bag) || bag.baseURL !== baseURL) {
      const resp = await http.post('/login.fcgi', { login: 'admin', password: 'admin' });
      const session = resp.data?.session;
      if (!session) throw new BadRequestException(`Falha ao logar no device ${deviceId}`);
      this.sess[deviceId] = { session, born: Date.now(), baseURL };
      this.logger.log(`✔ Session criada: device=${deviceId} host=${baseURL}`);
    }
  }

  private async getClient(deviceId: number) {
    await this.ensureSession(deviceId);
    const { http, baseURL } = await this.getHttp(deviceId);
    const session = this.sess[deviceId].session;
    return { http, session, baseURL };
  }

  // retry 1x em 401 (relogin)
  private async postWithSession<T = any>(
    deviceId: number,
    path: string,
    data?: any,
    config?: any,
  ): Promise<T> {
    let tried = false;
    while (true) {
      const { http, session, baseURL } = await this.getClient(deviceId);
      const url = path.includes('?') ? `${path}&session=${session}` : `${path}?session=${session}`;
      try {
        const res = await http.post(url, data, config);
        return res.data as T;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 && !tried) {
          this.logger.warn({ msg: 'idface.401.post', deviceId, baseURL });
          delete this.sess[deviceId]; // força relogin
          tried = true;
          continue;
        }
        if (status === 400) throw this.enrichBadRequest(e, { op: 'POST', path });
        throw e;
      }
    }
  }

  private async getWithSession<T = any>(
    deviceId: number,
    path: string,
    config?: any,
  ): Promise<T> {
    let tried = false;
    while (true) {
      const { http, session, baseURL } = await this.getClient(deviceId);
      const url = path.includes('?') ? `${path}&session=${session}` : `${path}?session=${session}`;
      try {
        const res = await http.get(url, config);
        return res.data as T;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 && !tried) {
          this.logger.warn({ msg: 'idface.401.get', deviceId, baseURL });
          delete this.sess[deviceId]; // força relogin
          tried = true;
          continue;
        }
        if (status === 400) throw this.enrichBadRequest(e, { op: 'GET', path });
        throw e;
      }
    }
  }

  async logout(deviceId: number): Promise<void> {
    const bag = this.sess[deviceId];
    if (!bag) return;
    try {
      const { http } = await this.getHttp(deviceId);
      await http.post(`/logout?session=${bag.session}`).catch(() => undefined);
    } finally {
      delete this.sess[deviceId];
      this.logger.log(`✔ Logout: device=${deviceId}`);
    }
  }

  /* =========================================================
   * CRUD Device
   * =======================================================*/
  async createDevice(dto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepo.create(dto);
    const saved = await this.deviceRepo.save(device);
    this.logger.log(`✔ Device criado em DB id=${saved.id}`);
    return saved;
  }
  async listDevices(): Promise<Device[]> {
    return this.deviceRepo.find();
  }
  async getDevice(deviceId: number): Promise<Device> {
    const d = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!d) throw new NotFoundException(`Device ${deviceId} não encontrado`);
    return d;
  }
  async updateDevice(deviceId: number, dto: UpdateDeviceDto): Promise<Device> {
    const d = await this.getDevice(deviceId);
    Object.assign(d, dto);
    const saved = await this.deviceRepo.save(d);
    this.logger.log(`✔ Device ${deviceId} atualizado em DB`);
    return saved;
  }
  async deleteDevice(deviceId: number): Promise<void> {
    const d = await this.getDevice(deviceId);
    await this.deviceRepo.remove(d);
    this.logger.log(`✔ Device ${deviceId} removido do DB`);
  }

  /* =========================================================
   * Objetos genéricos (Sync)
   * =======================================================*/
  async createUsersBatch(deviceId: number, users: CreateUserBatchItem[]): Promise<number[]> {
    const data = await this.postWithSession<{ ids: number[] }>(
      deviceId,
      '/create_objects.fcgi',
      { object: 'users', values: users },
    );
    if (!data?.ids) throw new BadRequestException('Erro ao criar usuários no device');
    this.logger.log({ msg: 'idface.create_users.ok', deviceId, count: data.ids.length });
    return data.ids;
  }

  private async createObjects(
    deviceId: number,
    object: string,
    values: Record<string, any>[],
  ): Promise<number[]> {
    const data = await this.postWithSession<{ ids: number[] }>(
      deviceId,
      '/create_objects.fcgi',
      { object, values },
    );
    if (!data?.ids) throw new BadRequestException(`Falha ao criar ${object}`);
    return data.ids;
  }

  private async modifyObjects(
    deviceId: number,
    object: string,
    values: Record<string, any>,   // objeto
    where: Record<string, any>,
  ): Promise<void> {
    await this.postWithSession(
      deviceId,
      '/modify_objects.fcgi',
      { object, values, where },
    );
  }

  async updateUsersBatch(
    deviceId: number,
    updates: Array<{ id: number; values: Record<string, any> }>,
  ): Promise<void> {
    if (!updates?.length) return;
    for (const u of updates) {
      await this.modifyObjects(deviceId, 'users', u.values, { users: { id: u.id } });
    }
    this.logger.log({ msg: 'idface.update_users.ok', deviceId, count: updates.length });
  }

  async deleteObjects(
    deviceId: number,
    object: string,
    where: Record<string, any>,
  ): Promise<void> {
    await this.postWithSession(deviceId, '/destroy_objects.fcgi', { object, where });
    this.logger.log(`✔ destroy ${object} on device ${deviceId}`);
  }

  async loadObjects(
    deviceId: number,
    object: string,
    where?: Record<string, any>,
  ): Promise<any[]> {
    const body: JSONObject = { object };
    if (where) body.where = where;
    const data = await this.postWithSession<{ objects: any[] }>(
      deviceId,
      '/load_objects.fcgi',
      body,
    );
    return data.objects ?? [];
  }

  /* =========================================================
   * Fotos
   * =======================================================*/
  async uploadUserPhoto(
    deviceId: number,
    userId: number,
    image: Buffer,
    opts: UploadPhotoOptions = {},
  ): Promise<{ user_id: number; success: boolean; scores?: any; errors?: any[] }> {
    const timestamp =
      typeof opts.timestamp === 'number' ? opts.timestamp : Math.floor(Date.now() / 1000);
    const match = opts.match ?? 0;

    const data = await this.postWithSession(
      deviceId,
      `/user_set_image.fcgi?user_id=${userId}&timestamp=${timestamp}&match=${match}`,
      image,
      { headers: { 'Content-Type': 'application/octet-stream' }, maxBodyLength: 2 * 1024 * 1024 },
    );

    if (data?.success !== true) {
      this.logger.warn(`⚠ Falha cadastro foto user=${userId} device=${deviceId}: ${JSON.stringify(data)}`);
    } else {
      this.logger.log(`✔ Foto cadastrada: user ${userId} on device ${deviceId}`);
    }
    return data;
  }

  async testUserImage(
    deviceId: number,
    buffer: Buffer,
  ): Promise<{ success: boolean; scores?: any; errors?: any[] }> {
    return this.postWithSession(
      deviceId,
      '/user_test_image.fcgi',
      buffer,
      { headers: { 'Content-Type': 'application/octet-stream' }, maxBodyLength: 2 * 1024 * 1024 },
    );
  }

  async getUserImage(
    deviceId: number,
    userId: number,
    withTimestamp = false,
  ): Promise<{ timestamp: number; image: string } | Buffer> {
    if (withTimestamp) {
      return this.getWithSession(deviceId, `/user_get_image.fcgi?user_id=${userId}&get_timestamp=1`);
    }
    // raw
    const { http, session } = await this.getClient(deviceId);
    const url = `/user_get_image.fcgi?user_id=${userId}&get_timestamp=0&session=${session}`;
    const res = await http.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }

  async listUsersWithImage(
    deviceId: number,
    withTimestamp = false,
  ): Promise<number[] | Array<{ user_id: number; timestamp: number }>> {
    const data = await this.getWithSession(
      deviceId,
      `/user_list_images.fcgi?get_timestamp=${withTimestamp ? 1 : 0}`,
    );
    return withTimestamp ? data.image_info : data.user_ids;
  }

  async getUserImageList(
    deviceId: number,
    userIds: number[],
  ): Promise<Array<{ id: number; timestamp: number; image: string } | { id: number; error: { code: number; message: string } }>> {
    if (!userIds.length) return [];
    if (userIds.length > 100) throw new BadRequestException('Máximo de 100 userIds por requisição');
    const data = await this.postWithSession(
      deviceId,
      '/user_get_image_list.fcgi',
      { user_ids: userIds },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.user_images ?? [];
  }

  async uploadUserPhotoList(
    deviceId: number,
    entries: Array<{ user_id: number; imageBase64: string; timestamp?: number }>,
    match: boolean = false,
  ): Promise<any> {
    if (!entries.length) return { results: [] };
    const user_images = entries.map((e) => ({
      user_id: e.user_id,
      timestamp: typeof e.timestamp === 'number' ? e.timestamp : Math.floor(Date.now() / 1000),
      image: e.imageBase64,
    }));
    return this.postWithSession(
      deviceId,
      '/user_set_image_list.fcgi',
      { match, user_images },
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  async destroyUserImages(
    deviceId: number,
    params: { user_id: number } | { user_ids: number[] } | { all: true } | { dangling: true },
  ): Promise<void> {
    await this.postWithSession(
      deviceId,
      '/user_destroy_image.fcgi',
      params,
      { headers: { 'Content-Type': 'application/json' } },
    );
    this.logger.log(
      `✔ user_destroy_image ${'user_id' in params ? params.user_id : 'user_ids' in params ? params.user_ids.length : Object.keys(params)[0]} device=${deviceId}`,
    );
  }

  /* =========================================================
   * Acesso / Regras
   * =======================================================*/
  classifyImageErrors(errors?: Array<{ code: number; message: string }>) {
    if (!errors?.length) return 'OK';
    const codes = errors.map((e) => e.code);
    if (codes.includes(2)) return 'FACE_NOT_DETECTED';
    if (codes.includes(8)) return 'LOW_SHARPNESS';
    if (codes.includes(4)) return 'NOT_CENTERED';
    return 'OTHER';
  }

  async ensureDefaultAccess(deviceId: number) {
    await this.ensureSession(deviceId);

    // 1) regra
    let ruleId: number;
    const rules = await this.loadObjects(deviceId, 'access_rules', { access_rules: { name: 'API_DEFAULT_ALLOW' } });
    if (rules.length) ruleId = rules[0].id;
    else {
      const [id] = await this.createObjects(deviceId, 'access_rules', [{ name: 'API_DEFAULT_ALLOW', type: 1, priority: 0 }]);
      ruleId = id;
    }

    // 2) portal
    const portals = await this.loadObjects(deviceId, 'portals');
    if (!portals.length) throw new Error('Nenhum portal encontrado no device');
    const portalId = portals[0].id;

    // 3) vincula
    const existing = await this.loadObjects(deviceId, 'portal_access_rules', { portal_access_rules: { portal_id: portalId, access_rule_id: ruleId } });
    if (!existing.length) {
      await this.createObjects(deviceId, 'portal_access_rules', [{ portal_id: portalId, access_rule_id: ruleId }]);
    }

    return { ruleId, portalId };
  }

  async addUserAccess(
    deviceId: number,
    userId: number,
    groupId = 1,
    accessRuleId = 1,
  ) {
    // 1) já existe user→grupo?
    const ug = await this.loadObjects(deviceId, 'user_groups', {
      user_groups: { user_id: userId, group_id: groupId },
    });
    if (!ug.length) {
      await this.safeCreateIgnoreUnique(deviceId, 'user_groups', { user_id: userId, group_id: groupId });
    }

    // 2) já existe user→regra?
    const ur = await this.loadObjects(deviceId, 'user_access_rules', {
      user_access_rules: { user_id: userId, access_rule_id: accessRuleId },
    });
    if (!ur.length) {
      await this.safeCreateIgnoreUnique(deviceId, 'user_access_rules', { user_id: userId, access_rule_id: accessRuleId });
    }

    this.logger.log(`✔ addUserAccess ok (user=${userId}, group=${groupId}, rule=${accessRuleId})`);
  }
  /** Cria objeto e ignora erro de UNIQUE/duplicado (idempotente). */
  private async safeCreateIgnoreUnique(
    deviceId: number,
    object: string,
    value: Record<string, any>,
  ): Promise<void> {
    try {
      await this.postWithSession(deviceId, '/create_objects.fcgi', { object, values: [value] });
    } catch (e: any) {
      // Quando vem pelo postWithSession, 400 vira BadRequestException com details.message
      const msg =
        (e?.response?.data?.error ?? e?.response?.data?.message) ||
        (e?.details?.error ?? e?.details?.message) ||
        e?.message || '';

      // Heurística pra "já existe"
      if (
        (e?.status === 400 || e?.response?.status === 400) &&
        /unique|already\s*exists|duplicad|violação/i.test(String(msg))
      ) {
        this.logger.debug({ msg: 'idface.create.duplicate_ignored', object, value });
        return; // trata como OK
      }
      throw e; // outros 400 sobem
    }
  }

  async liberarAcesso(deviceId: number, userId: number): Promise<void> {
    const data = await this.postWithSession(deviceId, '/liberar_acesso.cgi', { user_id: userId });
    if (!data?.success) throw new BadRequestException(`Falha ao liberar acesso para user ${userId}`);
    this.logger.log(`✔ Acesso liberado: user ${userId} on device ${deviceId}`);
  }
}
