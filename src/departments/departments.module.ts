// src/departments/departments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Departament } from './department.entity';
import { Visitante } from '../visitors/visitor.entity';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { Grupo } from '../groups/grupo.entity';
import { Device } from 'src/devices/idaface.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Departament, // já existia
      Visitante, // e este
      Grupo,
      Device, // e este também
    ]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
