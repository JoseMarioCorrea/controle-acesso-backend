// src/sync/sync.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { Pessoa } from '../pessoa/pessoa.entity';
import { Visitante } from '../visitors/visitor.entity';
import { IdfaceModule } from '../devices/idface.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pessoa, Visitante]),
    ScheduleModule.forRoot(),
    IdfaceModule, // para usar IdfaceService
  ],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
