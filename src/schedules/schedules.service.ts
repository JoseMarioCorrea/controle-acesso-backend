// src/schedules/schedules.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
  ) {}

  create(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepo.create(dto);
    return this.scheduleRepo.save(schedule);
  }

  findAll(): Promise<Schedule[]> {
    return this.scheduleRepo.find();
  }

  async findOne(id: number): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException('Horário não encontrado');
    }
    return schedule;
  }

  async update(id: number, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.scheduleRepo.save(schedule);
  }

  async remove(id: number): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepo.remove(schedule);
  }
}
