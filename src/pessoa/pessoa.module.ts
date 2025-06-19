// src/pessoa/pessoa.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pessoa } from './pessoa.entity';
import { Grupo } from '../groups/grupo.entity';
import { PessoasService } from './pessoas.service';
import { PessoasController } from './pessoas.controller';
import { IdfaceModule } from '../devices/idface.module';
import { VisitorsController } from '../visitors/visitors.controller';
import { VisitorModule } from 'src/visitors/visitors.module';
import { Visitante } from 'src/visitors/visitor.entity';
import { Terminal } from 'src/terminals/terminal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pessoa, Grupo, Terminal]),
    IdfaceModule           // ← importa o módulo do iDFace
  ],
  providers: [PessoasService],
  controllers: [PessoasController],
})
export class PessoaModule {}
