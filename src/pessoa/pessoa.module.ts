// pessoa.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pessoa } from './pessoa.entity';
import { PessoasService } from './pessoas.service';
import { PessoasController } from './pessoas.controller';
import { IdfaceService } from 'src/devices/idface.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pessoa])],
  providers: [PessoasService, IdfaceService],
  controllers: [PessoasController],
  exports: [PessoasService], // opcional, se for usar fora do módulo
})
export class PessoaModule {}
