// src/schedules/dto/create-schedule.dto.ts
import { IsString, Matches } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  diaSemana: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaInicio deve estar no formato HH:mm',
  })
  horaInicio: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaFim deve estar no formato HH:mm',
  })
  horaFim: string;
}
