// src/auth/oauth.service.ts
import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Garante que exista um usuário admin/admin.
   */
  async seedAdmin(): Promise<void> {
    const count = await this.userRepo.count();
    if (count === 0) {
      const hash = await bcrypt.hash('admin', this.saltRounds);
      const admin = this.userRepo.create({ nome: 'admin', senha: hash, isMaster: true });
      await this.userRepo.save(admin);
      this.logger.log('Usuário admin criado');
    }
  }

  /**
   * Valida credenciais e retorna o usuário.
   */
  async validateUser(nome: string, senha: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { nome } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) throw new UnauthorizedException('Credenciais inválidas');
    return user;
  }

  /**
   * Login: garante seed e valida, retorna user.
   */
  async login(dto: LoginDto): Promise<Omit<User, 'senha'>> {
    await this.seedAdmin();
    const user = await this.validateUser(dto.nome, dto.senha);
    const { senha, ...rest } = user;
    return rest;
  }
}