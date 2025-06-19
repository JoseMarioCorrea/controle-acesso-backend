import { IsISO8601 } from 'class-validator';

export class SetTimeDto {
  @IsISO8601()
  datetime: string;
}
