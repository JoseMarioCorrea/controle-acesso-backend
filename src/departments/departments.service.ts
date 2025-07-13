// src/departments/departments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departament } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Visitante } from '../visitors/visitor.entity';
import { Grupo } from '../groups/grupo.entity';
import { CreateGrupoDto } from '../groups/dto/create-grupo.dto';
@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Departament)
    private readonly deptRepo: Repository<Departament>,
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
  ) {}

  /* async create(dto: CreateDepartmentDto): Promise<Departament> {
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
  }*/

  async findAll(): Promise<Departament[]> {
    return this.deptRepo.find();
  }

  async findOne(id: number): Promise<Departament> {
    return this.deptRepo.findOneOrFail({ where: { id } });
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Departament> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');

    if (dto.visitorIds) {
    }
    if (dto.nome) dept.nome = dto.nome;

    return this.deptRepo.save(dept);
  }

  async remove(id: number): Promise<void> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');
    await this.deptRepo.remove(dept);
  }
  async create(dto: CreateDepartmentDto): Promise<Departament> {
    // 1) cria o departamento
    const dept = this.deptRepo.create(dto);
    await this.deptRepo.save(dept);

    // 2) cria automaticamente um grupo do tipo “3” (ou com o mesmo nome do depto, etc)
    const grupoDto: CreateGrupoDto & { departmentId: number } = {
      nome: `Grupo ${dept.nome}`,
      descricao: `Grupo padrão para o departamento ${dept.nome}`,
      departmentId: dept.id,
    };
    const grupo = this.grupoRepo.create(grupoDto);
    await this.grupoRepo.save(grupo);

    return dept;
  }

  async findGroupsByDepartment(departmentId: number): Promise<Grupo[]> {
    return this.grupoRepo.find({
      where: { departmentId: departmentId },
    });
  }
}
