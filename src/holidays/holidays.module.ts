// src/holidays/holidays.module.ts
import { Module } from '@nestjs/common';
import { HolidaysService } from '../holidays/holidays.service';
import { HolidaysController } from '../holidays/holidays.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Holiday } from './holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Holiday])],
  controllers: [HolidaysController],
  providers: [HolidaysService],
})
export class HolidaysModule {}
