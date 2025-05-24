// src/holidays/dto/create-holiday.dto.ts
import { IsString, IsDateString, IsBoolean } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  nome: string;

  @IsDateString()
  data: string;

  @IsString()
  tipo: string;

  @IsBoolean()
  repeteAnualmente: boolean;
}
