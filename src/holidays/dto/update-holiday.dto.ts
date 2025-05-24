// src/holidays/dto/update-holiday.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateHolidayDto } from './create-holiday.dto';

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) {}
