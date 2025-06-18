// src/visitors/visitors.module.ts
import { Module } from '@nestjs/common';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitante } from './visitor.entity';
import { Pessoa } from '../pessoa/pessoa.entity';
import { PessoaModule } from '../pessoa/pessoa.module';
import { IdfaceModule } from 'src/devices/idface.module';
import { Department } from 'src/departments/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visitante, Pessoa, Department]),
    IdfaceModule, // caso use o service de pessoas
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService], // se outro módulo precisar
})
export class VisitorModule {}
