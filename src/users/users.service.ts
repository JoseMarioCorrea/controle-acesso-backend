// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from '../departments/department.entity';

@Injectable()
export class UsersService {
  findAll() {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto);

    if (dto.departamentoId) {
      const dept = await this.deptRepo.findOneBy({ id: dto.departamentoId });
      if (!dept) {
        throw new NotFoundException('Departamento não encontrado');
      }
      user.departamento = dept;
    }

    return this.userRepo.save(user);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['departamento'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, dto);

    if (dto.departamentoId) {
      const dept = await this.deptRepo.findOneBy({ id: dto.departamentoId });
      if (!dept) {
        throw new NotFoundException('Departamento não encontrado');
      }
      user.departamento = dept;
    }

    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    // void não precisa de return, mas está correto ter o await
  }
}
