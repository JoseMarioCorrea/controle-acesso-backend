import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncTask } from './sync-task.entity';
import { SyncDeviceUserMap } from './sync-device-user-map.entity';
import { SyncService } from './sync.service';
import { Pessoa } from '../pessoa/pessoa.entity';
import { Visitante } from '../visitors/visitor.entity';
import { Device } from '../devices/idaface.entity';
import { Grupo } from '../groups/grupo.entity';
import { IdfaceModule } from '../devices/idface.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      SyncTask,
      SyncDeviceUserMap,
      Pessoa,
      Visitante,
      Device,
      Grupo, // necessário porque o SyncService faz consultas envolvendo grupos (visitantes)
    ]),
     forwardRef(() => IdfaceModule),
  ],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
