// src/visitors/visitors.module.ts
import { Module } from '@nestjs/common';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitante } from './visitor.entity';
import { Pessoa } from '../pessoa/pessoa.entity';
import { PessoaModule } from '../pessoa/pessoa.module';
import { IdfaceModule } from 'src/devices/idface.module';
import { Departament } from '../departments/department.entity';
import { Grupo } from 'src/groups/grupo.entity';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visitante, Pessoa, Departament, Grupo]),
    IdfaceModule, // caso use o service de pessoas
    SyncModule,

  ],
  controllers: [VisitorsController,],
  providers: [VisitorsService,],
  exports: [VisitorsService], // se outro módulo precisar
})
export class VisitorModule { }
