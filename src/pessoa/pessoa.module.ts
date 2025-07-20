// src/pessoa/pessoa.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pessoa } from './pessoa.entity';
import { Grupo } from '../groups/grupo.entity';
import { PessoasService } from './pessoas.service';
import { PessoasController } from './pessoas.controller';
import { IdfaceModule } from '../devices/idface.module';
import { Terminal } from 'src/terminals/terminal.entity';
import { Departament } from '../departments/department.entity';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pessoa, Grupo, Terminal, Departament]),
    IdfaceModule, // ← importa o módulo do iDFace
    SyncModule
  ],
  providers: [PessoasService],
  controllers: [PessoasController],
})
export class PessoaModule {}
