// src/departments/dto/create-department.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  nome: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt({ message: 'deviceId deve ser um inteiro' })
  deviceId: number;

  @IsOptional()
  @IsArray()
  userIds?: number[];

  @IsOptional()
  @IsArray()
  visitorIds?: number[];
}
