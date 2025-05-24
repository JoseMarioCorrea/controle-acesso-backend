// src/holidays/holidays.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private holidayRepo: Repository<Holiday>,
  ) {}

  create(dto: CreateHolidayDto): Promise<Holiday> {
    const holiday = this.holidayRepo.create(dto);
    return this.holidayRepo.save(holiday);
  }

  findAll(): Promise<Holiday[]> {
    return this.holidayRepo.find();
  }

  async findOne(id: number): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOneBy({ id });
    if (!holiday) throw new NotFoundException('Feriado não encontrado');
    return holiday;
  }

  async update(id: number, dto: UpdateHolidayDto): Promise<Holiday> {
    const holiday = await this.findOne(id);
    Object.assign(holiday, dto);
    return this.holidayRepo.save(holiday);
  }

  async remove(id: number): Promise<void> {
    const holiday = await this.findOne(id);
    await this.holidayRepo.remove(holiday);
  }
}
