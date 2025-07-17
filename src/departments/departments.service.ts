// src/departments/departments.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Departament } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Device } from '../devices/idaface.entity';
import { Grupo } from '../groups/grupo.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Departament) private readonly deptRepo: Repository<Departament>,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Grupo) private readonly grupoRepo: Repository<Grupo>,
  ) { }

  /* ------------------------------------------------------------------
   * CREATE  ── cria depto, opcionalmente vincula device e gera grupo‑padrão
   * -----------------------------------------------------------------*/
  async create(dto: CreateDepartmentDto): Promise<Departament> {
    const { deviceId, ...rest } = dto;

    // 1) cria dept
    const dept = this.deptRepo.create(rest);
    await this.deptRepo.save(dept);

    // 2) vincula device (se informado)
    if (deviceId) {
      const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
      if (device) {
        device.departmentId = dept.id;  // ou device.department = dept;
        await this.deviceRepo.save(device);
      } else {
        // opcional: lançar erro
        // throw new NotFoundException(`Device ${deviceId} não encontrado`);
        console.warn(`Device ${deviceId} não encontrado; dept ${dept.id} criado sem terminal.`);
      }
    }

    // 3) cria grupo padrão
    const grupo = this.grupoRepo.create({
      nome: `Grupo ${dept.nome}`,
      descricao: `Grupo padrão para o departamento ${dept.nome}`,
      department: dept,
    } as any);
    await this.grupoRepo.save(grupo);

    return dept;
  }
  /* ------------------------------------------------------------------
   * FIND – listagem formatada ou registro único
   * -----------------------------------------------------------------*/
  async findAll() {
    const depts = await this.deptRepo.find({ relations: ['devices'] });
    return depts.map(d => ({
      id: d.id,
      nome: d.nome,
      terminal: d.devices[0]
        ? { id: d.devices[0].id, name: d.devices[0].name, host: d.devices[0].ip }
        : null,
    }));
  }

  async findOne(id: number): Promise<Departament> {
    return this.deptRepo.findOneOrFail({ where: { id }, relations: ['devices'] });
  }

  /* ------------------------------------------------------------------
   * UPDATE – atualiza dados e (re)associa device
   * -----------------------------------------------------------------*/
  /* update */
  async update(id: number, dto: UpdateDepartmentDto): Promise<Departament> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');

    const { deviceId, ...rest } = dto;
    Object.assign(dept, rest);
    await this.deptRepo.save(dept);

    // (re) associação de device
    if (deviceId) {
      const device = await this.deviceRepo.findOneByOrFail({ id: deviceId });
      device.department = dept;          // seta a ENTIDADE
      await this.deviceRepo.save(device); // salva FK automaticamente
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const dept = await this.deptRepo.findOne({
      where: { id },
      relations: ['devices'],
    });
    if (!dept) throw new NotFoundException('Departamento não encontrado');

    /* 1) desassocia todos os devices que apontam para o depto */
    await this.deviceRepo.update(
      { department: { id } },   // critério
      { department: {} },     // solta FK
    );

    /* 2) remove o departamento */
    await this.deptRepo.remove(dept);
  }

  /* ------------------------------------------------------------------
   * GROUPS deste departamento
   * -----------------------------------------------------------------*/
  async findGroupsByDepartment(departmentId: number): Promise<Grupo[]> {
    return this.grupoRepo.find({ where: { departmentId } });
  }
}
