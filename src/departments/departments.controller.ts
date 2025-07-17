// src/departments/departments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateGrupoDto } from '../groups/dto/create-grupo.dto';
import { Grupo } from '../groups/grupo.entity';
import { Departament } from './department.entity';


@UsePipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}))


@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    @InjectRepository(Departament)
    private readonly deptRepo: Repository<Departament>,
    @InjectRepository(Grupo)
    private readonly grupoRepo: Repository<Grupo>,
  ) { }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }

  /**
   * POST /departments
   * Cria um departamento e, em seguida, um grupo padrão do tipo 3
   */
  @Post()
  async create(@Body() dto: CreateDepartmentDto): Promise<Departament> {
    // 1) cria o departamento
    const dept = this.deptRepo.create(dto);
    await this.deptRepo.save(dept);

    // 2) cria automaticamente um grupo do tipo “3”
    const grupoDto: CreateGrupoDto & { department: Departament } = {
      nome: `Grupo ${dept.nome}`,
      descricao: `Grupo padrão para o departamento ${dept.nome}`,
      // se o seu CreateGrupoDto não levar `department` no body,
      // ajuste conforme seu DTO e entidade real
      department: dept,
    };
    const grupo = this.grupoRepo.create(grupoDto as any);
    await this.grupoRepo.save(grupo);

    return dept;
  }

  /**
   * GET /departments/:id/groups
   * Lista os grupos vinculados a um departamento
   */
  @Get(':id/groups')
  findGroupsByDepartment(
    @Param('id', ParseIntPipe) departmentId: number,
  ): Promise<Grupo[]> {
    return this.grupoRepo.find({
      where: { department: { id: departmentId } },
    });
  }
}
