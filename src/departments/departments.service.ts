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

    // 1) departamento
    const dept = this.deptRepo.create(rest);
    await this.deptRepo.save(dept);

    // 2) vincula device (se houver)
    if (deviceId) {
      await this.deviceRepo.update(deviceId, { departmentId: dept.id });
    }

    // 3) grupo padrão tipo 3
    await this.grupoRepo.save(
      this.grupoRepo.create({
        nome: `Grupo ${dept.nome}`,
        descricao: `Grupo padrão para o departamento ${dept.nome}`,
        department: dept,
      } as any),
    );

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
  async update(id: number, dto: UpdateDepartmentDto): Promise<Departament> {
    const dept = await this.deptRepo.findOne({ where: { id }, relations: ['devices'] });
    if (!dept) throw new NotFoundException('Departamento não encontrado');

    const { deviceId, ...rest } = dto;

    // 1) dados básicos
    Object.assign(dept, rest);
    await this.deptRepo.save(dept);

    // 2) (re)associação de device
    if (deviceId !== undefined) {
      // desvincula todos os devices atuais do depto → SET NULL
      await this.deviceRepo.update({ departmentId: id }, { departmentId: null });

      // vincula novo, se informado
      if (deviceId) {
        await this.deviceRepo.update(deviceId, { departmentId: id });
      }
    }

    return this.findOne(id);
  }

  /* ------------------------------------------------------------------
   * REMOVE – exclui departamento e limpa vínculo dos devices
   * -----------------------------------------------------------------*/

  async remove(id: number): Promise<void> {
    // 1) verifica existência
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');

    /* ---------------------------------------------------------------
     * 2) DESVINCULA / REMOVE RELAÇÕES QUE APONTAM PARA O DEPARTAMENTO
     *    (ordem importa para não violar FK)
     * -------------------------------------------------------------*/

    // a) solta devices → departmentId = NULL
    await this.deviceRepo.update({ departmentId: id }, { departmentId: null });

    // b) apaga grupos ligados (join-tables têm ON DELETE CASCADE)
    await this.grupoRepo.delete({ department: { id } });

    // c) se Visitor ou Pessoa possuírem FK não-nula, solte aqui:
    //    await this.visitorRepo.update({ departmentId: id }, { departmentId: null });
    //    await this.pessoaRepo .update({ departmentId: id }, { departmentId: null });

    /* ---------------------------------------------------------------
     * 3) agora é seguro remover o departamento
     * -------------------------------------------------------------*/
    await this.deptRepo.remove(dept);
  }


  /* ------------------------------------------------------------------
   * GROUPS deste departamento
   * -----------------------------------------------------------------*/
  async findGroupsByDepartment(departmentId: number): Promise<Grupo[]> {
    return this.grupoRepo.find({ where: { departmentId } });
  }
}
