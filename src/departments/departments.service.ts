// src/departments/departments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private deptRepo: Repository<Department>,
  ) {}

  create(dto: CreateDepartmentDto): Promise<Department> {
    const dept = this.deptRepo.create(dto);
    return this.deptRepo.save(dept);
  }

  findAll(): Promise<Department[]> {
    return this.deptRepo.find();
  }

  async findOne(id: number): Promise<Department> {
    const dept = await this.deptRepo.findOneBy({ id });
    if (!dept) {
      throw new NotFoundException('Departamento não encontrado');
    }
    return dept;
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, dto);
    return this.deptRepo.save(dept);
  }

  async remove(id: number): Promise<void> {
    const dept = await this.findOne(id);
    await this.deptRepo.remove(dept);
  }
}
