// src/departments/departments.module.ts
import { Module } from '@nestjs/common';
import { DepartmentsService } from '../departments/departments.service';
import { DepartmentsController } from '../departments/departments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
