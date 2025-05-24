// src/schedules/schedules.module.ts
import { Module } from '@nestjs/common';
import { SchedulesService } from '../schedules/schedules.service';
import { SchedulesController } from '../schedules/schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
