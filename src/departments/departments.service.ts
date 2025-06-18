// src/departments/departments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Department } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User } from '../users/user.entity';
import { Visitante } from '../visitors/visitor.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    // carga de usuários e visitantes, se passar ids
    const usuarios = dto.userIds?.length
      ? await this.userRepo.findByIds(dto.userIds)
      : [];
    const visitantes = dto.visitorIds?.length
      ? await this.visitorRepo.findByIds(dto.visitorIds)
      : [];

    const dept = this.deptRepo.create({
      nome: dto.nome,
      terminalId: dto.terminalId,
      usuarios,
      visitantes,
    });
    return this.deptRepo.save(dept);
  }

  async findAll(): Promise<Department[]> {
    return this.deptRepo.find();
  }

  async findOne(id: number): Promise<Department> {
    return this.deptRepo.findOneOrFail({ where: { id } });
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');

    if (dto.userIds) {
      dept.usuarios = await this.userRepo.findByIds(dto.userIds);
    }
    if (dto.visitorIds) {
      dept.visitantes = await this.visitorRepo.findByIds(dto.visitorIds);
    }
    if (dto.nome) dept.nome = dto.nome;
    if (dto.terminalId) dept.terminalId = dto.terminalId;

    return this.deptRepo.save(dept);
  }

  async remove(id: number): Promise<void> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');
    await this.deptRepo.remove(dept);
  }
}
