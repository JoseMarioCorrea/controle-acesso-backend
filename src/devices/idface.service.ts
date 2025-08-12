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

interface CreateUserBatchItem {
  name: string;
  registration: string;
}

interface UpdateUserBatchItem {
  id: number;
  values: Record<string, any>;
}

interface UploadPhotoOptions {
  /** unix timestamp – default: now (segundos) */
  timestamp?: number;
  /** 0 ou 1: verificação de duplicidade (match face). Default 0 (mais rápido) */
  match?: 0 | 1;
}

@Injectable()
export class IdfaceService {
  private readonly logger = new Logger(IdfaceService.name);
  private sessions: Record<number, string> = {};
  /** TTL opcional de sessão em ms (se quiser renovar) */
  private readonly sessionTtlMs = 30 * 60 * 1000;
  private sessionBirth: Record<number, number> = {};

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) { }

  /* =========================================================
   * Infra básica
   * =======================================================*/
  // helper no topo do IdfaceService
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
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} não encontrado`);
    }
    const baseURL = `http://${device.ip}:${device.port}`;
    // Reaproveitamos a axiosRef para gerar uma instância isolada
    return this.httpService.axiosRef.create({ baseURL, timeout: 7000 });
  }

  private sessionExpired(deviceId: number) {
    const born = this.sessionBirth[deviceId];
    return !born || (Date.now() - born) > this.sessionTtlMs;
  }

  private async ensureSession(deviceId: number) {
    if (!this.sessions[deviceId] || this.sessionExpired(deviceId)) {
      const http = await this.getHttp(deviceId);
      const resp = await http.post('/login.fcgi', {
        login: 'admin',
        password: 'admin',
      });
      if (!resp.data?.session) {
        throw new BadRequestException(`Falha ao logar no device ${deviceId}`);
      }
      this.sessions[deviceId] = resp.data.session;
      this.sessionBirth[deviceId] = Date.now();
      this.logger.log(
        `✔ Session criada: device=${deviceId}, session=${resp.data.session}`,
      );
    }
  }

  async logout(deviceId: number): Promise<void> {
    const http = await this.getHttp(deviceId);
    const session = this.sessions[deviceId];
    if (!session) return;
    await http.post(`/logout?session=${session}`).catch(() => undefined);
    delete this.sessions[deviceId];
    delete this.sessionBirth[deviceId];
    this.logger.log(`✔ Logout: device=${deviceId}`);
  }

  /* =========================================================
   * CRUD de Device (sem alterações substanciais)
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
   * Objetos genéricos (já usados pelo Sync)
   * =======================================================*/
  async createUsersBatch(
    deviceId: number,
    users: CreateUserBatchItem[],
  ): Promise<number[]> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/create_objects.fcgi?session=${this.sessions[deviceId]}`;
    const body = { object: 'users', values: users };
    // createUsersBatch
    try {
      const resp = await http.post(url, body);
      if (!resp.data?.ids) throw new BadRequestException('Erro ao criar usuários no device');
      this.logger.log({ msg: 'idface.create_users.ok', deviceId, count: resp.data.ids.length });
      return resp.data.ids as number[];
    } catch (e: any) {
      if (e?.response?.status === 400) throw this.enrichBadRequest(e, { op: 'create_users', deviceId, usersCount: users.length });
      throw e;
    }
  }
  // ✅ novo helper genérico p/ modify_objects
  private async modifyObjects(
    deviceId: number,
    object: string,
    values: Record<string, any>, // <- OBJETO (não array!)
    where: Record<string, any>,
  ): Promise<void> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/modify_objects.fcgi?session=${this.sessions[deviceId]}`;
    try {
      await http.post(url, { object, values, where });
    } catch (e: any) {
      if (e?.response?.status === 400) {
        throw this.enrichBadRequest(e, {
          op: 'modify_objects',
          deviceId,
          object,
          where,
          values: Object.keys(values),
        });
      }
      throw e;
    }
  }

  // 🔧 FIX: updateUsersBatch — trocar values: [u.values] -> values: u.values (objeto)
  async updateUsersBatch(
    deviceId: number,
    updates: Array<{ id: number; values: Record<string, any> }>,
  ): Promise<void> {
    if (!updates?.length) return;
    for (const u of updates) {
      await this.modifyObjects(
        deviceId,
        'users',
        u.values,                          // <- objeto, ex: { name: '...', registration: '...' }
        { users: { id: u.id } },           // where como já estava
      );
    }
    this.logger.log({ msg: 'idface.update_users.ok', deviceId, count: updates.length });
  };

  async deleteObjects(
    deviceId: number,
    object: string,
    where: Record<string, any>,
  ): Promise<void> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/destroy_objects.fcgi?session=${this.sessions[deviceId]}`;
    await http.post(url, { object, where });
    this.logger.log(`✔ destroy ${object} on device ${deviceId}`);
  }

  async loadObjects(
    deviceId: number,
    object: string,
    where?: Record<string, any>,
  ): Promise<any[]> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/load_objects.fcgi?session=${this.sessions[deviceId]}`;
    const body: JSONObject = { object };
    if (where) body.where = where;
    const resp = await http.post(url, body);
    return resp.data.objects;
  }

  /* =========================================================
   * Fotos (Cadastro, Teste, Leitura, Listagem, Exclusão)
   * =======================================================*/

  /**
   * Cadastra a foto de um usuário (POST /user_set_image.fcgi)
   * Envia BINÁRIO cru + query string com user_id, timestamp, match.
   */
  async uploadUserPhoto(
    deviceId: number,
    userId: number,
    image: Buffer,
    opts: UploadPhotoOptions = {},
  ): Promise<{
    user_id: number;
    success: boolean;
    scores?: any;
    errors?: any[];
  }> {
    await this.ensureSession(deviceId);

    const timestamp =
      typeof opts.timestamp === 'number'
        ? opts.timestamp
        : Math.floor(Date.now() / 1000);
    const match = opts.match ?? 0;

    const http = await this.getHttp(deviceId);
    const url = `/user_set_image.fcgi?user_id=${userId}&timestamp=${timestamp}&match=${match}&session=${this.sessions[deviceId]}`;
    // Doc exige application/octet-stream e parâmetros por query string. :contentReference[oaicite:31]{index=31}
    // Também reforça que o Content-Type deve ser octet-stream. :contentReference[oaicite:32]{index=32}
    const resp = await http.post(url, image, {
      headers: { 'Content-Type': 'application/octet-stream' },
      maxBodyLength: 2 * 1024 * 1024, // <= 2MB (limite informado). :contentReference[oaicite:33]{index=33}
    });

    if (resp.data?.success !== true) {
      // Mantemos tentativa para análise externa (retornamos mesmo assim)
      this.logger.warn(
        `⚠ Falha cadastro foto user=${userId} device=${deviceId}: ${JSON.stringify(
          resp.data,
        )}`,
      );
    } else {
      this.logger.log(
        `✔ Foto cadastrada: user ${userId} on device ${deviceId}`,
      );
    }
    return resp.data;
  }

  /**
   * Testa imagem antes de cadastrar (POST /user_test_image.fcgi)
   * Envia binário cru, não armazena no equipamento. :contentReference[oaicite:34]{index=34}
   */
  async testUserImage(
    deviceId: number,
    buffer: Buffer,
  ): Promise<{
    success: boolean;
    scores?: any;
    errors?: any[];
  }> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/user_test_image.fcgi?session=${this.sessions[deviceId]}`;
    // Doc: enviar binário + contentType octet-stream. :contentReference[oaicite:35]{index=35}
    const resp = await http.post(url, buffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
      maxBodyLength: 2 * 1024 * 1024,
    });
    return resp.data;
  }

  /**
   * GET única foto (raw ou base64+timestamp) /user_get_image.fcgi
   * Se getTimestamp = true retorna JSON (timestamp + image base64). :contentReference[oaicite:36]{index=36}
   */
  async getUserImage(
    deviceId: number,
    userId: number,
    withTimestamp = false,
  ): Promise<{ timestamp: number; image: string } | Buffer> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const get_timestamp = withTimestamp ? 1 : 0;
    const url = `/user_get_image.fcgi?user_id=${userId}&get_timestamp=${get_timestamp}&session=${this.sessions[deviceId]}`;
    const resp = await http.get(url, {
      responseType: withTimestamp ? 'json' : 'arraybuffer',
    });
    if (withTimestamp) {
      return resp.data; // { timestamp, image(base64) } (doc) :contentReference[oaicite:37]{index=37}
    }
    return Buffer.from(resp.data);
  }

  /**
   * Lista IDs (ou IDs + timestamp) dos usuários com foto - GET /user_list_images.fcgi
   * withTimestamp=true retorna image_info[]. :contentReference[oaicite:38]{index=38}
   */
  async listUsersWithImage(
    deviceId: number,
    withTimestamp = false,
  ): Promise<number[] | Array<{ user_id: number; timestamp: number }>> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const get_timestamp = withTimestamp ? 1 : 0;
    const url = `/user_list_images.fcgi?get_timestamp=${get_timestamp}&session=${this.sessions[deviceId]}`;
    const resp = await http.get(url);
    if (withTimestamp) {
      return resp.data.image_info; // contém user_id + timestamp. :contentReference[oaicite:39]{index=39}
    }
    return resp.data.user_ids;
  }

  /**
   * POST /user_get_image_list.fcgi (até 100) – retorna base64 + timestamp por usuário. :contentReference[oaicite:40]{index=40}
   */
  async getUserImageList(
    deviceId: number,
    userIds: number[],
  ): Promise<
    Array<
      | { id: number; timestamp: number; image: string }
      | { id: number; error: { code: number; message: string } }
    >
  > {
    if (!userIds.length) return [];
    if (userIds.length > 100) {
      throw new BadRequestException(
        'Máximo de 100 userIds por requisição (limite do equipamento)',
      );
    }
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/user_get_image_list.fcgi?session=${this.sessions[deviceId]}`;
    const body = { user_ids: userIds };
    const resp = await http.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return resp.data.user_images; // cada item: id,timestamp,image ou erro. :contentReference[oaicite:41]{index=41}
  }

  /**
   * POST /user_set_image_list.fcgi – cadastro em massa com imagens base64. :contentReference[oaicite:42]{index=42}
   */
  async uploadUserPhotoList(
    deviceId: number,
    entries: Array<{ user_id: number; imageBase64: string; timestamp?: number }>,
    match: boolean = false,
  ): Promise<any> {
    if (!entries.length) return { results: [] };
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/user_set_image_list.fcgi?session=${this.sessions[deviceId]}`;
    const user_images = entries.map((e) => ({
      user_id: e.user_id,
      timestamp:
        typeof e.timestamp === 'number'
          ? e.timestamp
          : Math.floor(Date.now() / 1000),
      image: e.imageBase64,
    }));
    const resp = await http.post(
      url,
      { match, user_images },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return resp.data; // results[] segue formato de upload individual + user_id
  }

  /**
   * Exclui foto(s) (POST /user_destroy_image.fcgi). :contentReference[oaicite:43]{index=43}
   */
  async destroyUserImages(
    deviceId: number,
    params:
      | { user_id: number }
      | { user_ids: number[] }
      | { all: true }
      | { dangling: true },
  ): Promise<void> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/user_destroy_image.fcgi?session=${this.sessions[deviceId]}`;
    await http.post(url, params, {
      headers: { 'Content-Type': 'application/json' },
    });
    this.logger.log(
      `✔ user_destroy_image ${'user_id' in params
        ? params.user_id
        : 'user_ids' in params
          ? params.user_ids.length
          : Object.keys(params)[0]
      } device=${deviceId}`,
    );
  }

  /* =========================================================
   * Acesso (exemplo – permanece como antes)
   * =======================================================*/
  async liberarAcesso(deviceId: number, userId: number): Promise<void> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/liberar_acesso.cgi?session=${this.sessions[deviceId]}`;
    const resp = await http.post(url, { user_id: userId }).catch((e) => {
      throw new BadRequestException(
        `Falha ao liberar acesso user ${userId}: ${e.message}`,
      );
    });
    if (!resp.data?.success) {
      throw new BadRequestException(
        `Falha ao liberar acesso para user ${userId}`,
      );
    }
    this.logger.log(`✔ Acesso liberado: user ${userId} on device ${deviceId}`);
  }

  /* =========================================================
   * Utilidades de interpretação de erros (opc.)
   * =======================================================*/
  classifyImageErrors(errors?: Array<{ code: number; message: string }>) {
    if (!errors?.length) return 'OK';
    // Exemplo simples mapeando subset de códigos para motivos
    const codes = errors.map((e) => e.code);
    if (codes.includes(2)) return 'FACE_NOT_DETECTED';
    if (codes.includes(8)) return 'LOW_SHARPNESS'; // "Low sharpness". :contentReference[oaicite:44]{index=44}
    if (codes.includes(4)) return 'NOT_CENTERED';
    return 'OTHER';
  }

  // trechos principais – coloque no IdfaceService
  async ensureDefaultAccess(deviceId: number) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const sess = this.sessions[deviceId];

    /* 1. Garante regra de permissão “API_DEFAULT_ALLOW” ------------------- */
    let ruleId: number;
    const rules = await this.loadObjects(deviceId, 'access_rules',
      { access_rules: { name: 'API_DEFAULT_ALLOW' } });
    if (rules.length) { ruleId = rules[0].id; }
    else {
      const [id] = await this.createObjects(deviceId, 'access_rules', [{
        name: 'API_DEFAULT_ALLOW', type: 1, priority: 0
      }]);
      ruleId = id;
    }

    /* 2. Descobre portal (primeiro portal físico) ------------------------ */
    const portals = await this.loadObjects(deviceId, 'portals');
    if (!portals.length) throw new Error('Nenhum portal encontrado no device');
    const portalId = portals[0].id;

    /* 3. Vincula regra ↔ portal ----------------------------------------- */
    const existing = await this.loadObjects(deviceId, 'portal_access_rules',
      { portal_access_rules: { portal_id: portalId, access_rule_id: ruleId } });
    if (!existing.length) {
      await this.createObjects(deviceId, 'portal_access_rules',
        [{ portal_id: portalId, access_rule_id: ruleId }]);
    }

    return { ruleId, portalId };
  }

  /* Helper genérico p/ POST /create_objects.fcgi ------------------------- */
  private async createObjects(
    deviceId: number,
    object: string,
    values: Record<string, any>[]
  ): Promise<number[]> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/create_objects.fcgi?session=${this.sessions[deviceId]}`;
    const { data } = await http.post(url, { object, values });
    if (!data?.ids) throw new BadRequestException(`Falha ao criar ${object}`);
    return data.ids as number[];
  }

  /* 4. Liga usuário à regra --------------------------------------------- */
  // src/idface/idface.service.ts
  // (adicione logo abaixo de uploadUserPhoto)


  /**
   * Vincula o usuário a uma Regra de Acesso (users_access_rules).
   * - Se a regra já existir, trata como sucesso silencioso.
   */
  async addUserAccess(
    deviceId: number,
    userId: number,
    groupId = 1,
    accessRuleId = 1,
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);

    /** helper genérico que tenta inserir e ignora erro 400 “unique” */
    const safeCreate = async (object: string, values: any) => {
      try {
        await http.post(
          `/create_objects.fcgi?session=${this.sessions[deviceId]}`,
          { object, values: [values] },
        );
      } catch (e: any) {
        // Se já existir, a API responde 400 + msg “unique constraint”
        if (e?.response?.status !== 400) throw e;
      }
    };

    // 1) vínculo user → grupo
    await safeCreate('user_groups', { user_id: userId, group_id: groupId });

    // 2) vínculo user → regra de acesso
    await safeCreate('user_access_rules', {
      user_id: userId,
      access_rule_id: accessRuleId,
    });

    this.logger.log(
      `✔ addUserAccess ok (user=${userId}, group=${groupId}, rule=${accessRuleId})`,
    );
  }

}
