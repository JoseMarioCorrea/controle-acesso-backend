// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from '../departments/department.entity';
import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) { }

  /** Lista todos os usuários com departamento */
  async findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: ['departamento'] });
  }

  /** Retorna um usuário por id */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['departamento'],
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  /** Cria um novo usuário (sem foto física) */
  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto);
    if (dto.departamentoId) {
      const dept = await this.deptRepo.findOneBy({ id: dto.departamentoId });
      if (!dept) throw new NotFoundException('Departamento não encontrado');
      user.departamento = dept;
    }
    return this.userRepo.save(user);
  }

  /** Atualiza dados do usuário (sem foto física) */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    if (dto.departamentoId) {
      const dept = await this.deptRepo.findOneBy({ id: dto.departamentoId });
      if (!dept) throw new NotFoundException('Departamento não encontrado');
      user.departamento = dept;
    }
    return this.userRepo.save(user);
  }

  /** Remove usuário do banco */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }

  /**
   * Grava o arquivo de foto em uploads/users/:userId e retorna o path público
   */
  async savePhoto(userId: number, file: Express.Multer.File): Promise<string> {
    const baseDir = process.cwd();
    const dir = join(baseDir, 'uploads', 'users', String(userId));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const dest = join(dir, filename);

    if (file.buffer) {
      writeFileSync(dest, file.buffer);
    } else if (file.path) {
      copyFileSync(file.path, dest);
    } else {
      throw new BadRequestException('Arquivo de foto inválido');
    }

    return `/uploads/users/${userId}/${filename}`;
  }

  /** Lista todas as fotos de um usuário */
  async listPhotos(userId: number): Promise<string[]> {
    const dir = join(process.cwd(), 'uploads', 'users', String(userId));
    if (!existsSync(dir)) return [];
    return readdirSync(dir).map((f) => `/uploads/users/${userId}/${f}`);
  }

  /** Retorna a foto mais recente, baseado em ordenação pelo nome */
  async getLatestPhoto(userId: number): Promise<string> {
    const paths = await this.listPhotos(userId);
    if (!paths.length) return '';
    paths.sort().reverse();
    return paths[0];
  }
}
