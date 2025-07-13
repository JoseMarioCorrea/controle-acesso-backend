// src/idface/idface.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Device } from 'src/devices/idaface.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/createDevice.dto';
import { UpdateDeviceDto } from './dto/updateDevice.dto';

@Injectable()
export class IdfaceService {
  private readonly logger = new Logger(IdfaceService.name);
  private sessions: Record<number, string> = {};

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) { }

  /**
   * Retorna instância HTTP configurada para o device
   */
  private async getHttp(deviceId: number) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException(`Device ${deviceId} não encontrado`);
    const baseURL = `http://${device.ip}:${device.port}`;
    return this.httpService.axiosRef.create({ baseURL, timeout: 5000 });
  }

  /**
   * Salva um novo device (nome, modelo, ip, porta) em base.
   */
  async createDevice(dto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepo.create(dto);
    const saved = await this.deviceRepo.save(device);
    this.logger.log(`✔ Device criado em DB id=${saved.id}`);
    return saved;
  }

  /**
   * Lista todos os devices cadastrados.
   */
  async listDevices(): Promise<Device[]> {
    return this.deviceRepo.find();
  }

  /**
   * Busca um device pelo ID.
   */
  async getDevice(deviceId: number): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException(`Device ${deviceId} não encontrado`);
    return device;
  }

  /**
   * Atualiza os dados do device em base.
   */
  async updateDevice(
    deviceId: number,
    dto: UpdateDeviceDto
  ): Promise<Device> {
    const device = await this.getDevice(deviceId);
    Object.assign(device, dto);
    const saved = await this.deviceRepo.save(device);
    this.logger.log(`✔ Device ${deviceId} atualizado em DB`);
    return saved;
  }

  /**
   * Remove (delete) o device da base.
   */
  async deleteDevice(deviceId: number): Promise<void> {
    const device = await this.getDevice(deviceId);
    await this.deviceRepo.remove(device);
    this.logger.log(`✔ Device ${deviceId} removido do DB`);
  }

  /**
   * Garante sessão ativa no device
   */
  private async ensureSession(deviceId: number) {
    if (!this.sessions[deviceId]) {
      const http = await this.getHttp(deviceId);
      const resp = await http.post('/login.fcgi', { login: 'admin', password: 'admin' });
      if (!resp.data?.session) {
        throw new BadRequestException(`Falha ao logar no device ${deviceId}`);
      }
      this.sessions[deviceId] = resp.data.session;
      this.logger.log(`✔ Session criada: device=${deviceId}, session=${resp.data.session}`);
    }
  }

  /**
   * Logout da sessão
   */
  async logout(deviceId: number): Promise<void> {
    const http = await this.getHttp(deviceId);
    const session = this.sessions[deviceId];
    if (!session) return;
    await http.post(`/logout?session=${session}`);
    delete this.sessions[deviceId];
    this.logger.log(`✔ Logout: device=${deviceId}`);
  }

  /**
   * Cria usuários de forma assíncrona via batch
   */
  async createUsersBatch(
    deviceId: number,
    users: Array<{ name: string; registration: string }>
  ): Promise<number[]> {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/create_objects.fcgi?session=${this.sessions[deviceId]}`;
    const body = { object: 'users', values: users };
    const resp = await http.post(url, body);
    if (!resp.data?.ids) {
      throw new BadRequestException('Erro ao criar usuários no device');
    }
    this.logger.log(`✔ Batch criado: ${resp.data.ids.length} users on device ${deviceId}`);
    return resp.data.ids as number[];
  }

  /**
   * Atualiza campos de usuários em lote
   */
  async updateUsersBatch(
    deviceId: number,
    updates: Array<{ id: number; values: Record<string, any> }>
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/modify_objects.fcgi?session=${this.sessions[deviceId]}`;
    for (const u of updates) {
      const body = { object: 'users', values: [u.values], where: { users: { id: u.id } } };
      await http.post(url, body);
    }
    this.logger.log(`✔ Batch update: ${updates.length} users on device ${deviceId}`);
  }

  /**
   * Remove objetos do device
   */
  async deleteObjects(
    deviceId: number,
    object: string,
    where: Record<string, any>
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/destroy_objects.fcgi?session=${this.sessions[deviceId]}`;
    const body = { object, where };
    await http.post(url, body);
    this.logger.log(`✔ destroy ${object} on device ${deviceId}`);
  }

  /**
   * Carrega objetos do device
   */
  async loadObjects(
    deviceId: number,
    object: string,
    where?: Record<string, any>
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/load_objects.fcgi?session=${this.sessions[deviceId]}`;
    const body = { object, ...(where ? { where } : {}) };
    const resp = await http.post(url, body);
    return resp.data.objects;
  }

  /**
   * Upload de foto de usuário
   */
  async uploadUserPhoto(
    deviceId: number,
    userId: number,
    image: Buffer
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/user_set_image.fcgi?user_id=${userId}&match=0&session=${this.sessions[deviceId]}`;
    const resp = await http.post(url, image, { headers: { 'Content-Type': 'application/octet-stream' } });
    if (!resp.data?.success) {
      throw new BadRequestException('Erro ao cadastrar foto no device');
    }
    this.logger.log(`✔ Foto cadastrada: user ${userId} on device ${deviceId}`);
  }

  /**
   * Teste de identificação facial
   */
  async testUserImage(
    deviceId: number,
    image: Buffer
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/user_test_image.fcgi?session=${this.sessions[deviceId]}`;
    const resp = await http.post(url, image, { headers: { 'Content-Type': 'application/octet-stream' } });
    return resp.data;
  }

  /**
   * Exemplo de endpoint de acesso (liberar acesso)
   */
  async liberarAcesso(
    deviceId: number,
    userId: number
  ) {
    await this.ensureSession(deviceId);
    const http = await this.getHttp(deviceId);
    const url = `/liberar_acesso.cgi?session=${this.sessions[deviceId]}`;
    const resp = await http.post(url, { user_id: userId });
    if (!resp.data.success) {
      throw new BadRequestException(`Falha ao liberar acesso para user ${userId}`);
    }
    this.logger.log(`✔ Acesso liberado: user ${userId} on device ${deviceId}`);
  }
}
