// src/departments/dto/create-department.dto.ts
import { IsInt, IsOptional, IsString, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartmentDto {
  @IsString()
  nome: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deviceId?: number;

  // opcionais (se usados)
  @IsOptional() @IsArray() userIds?: number[];
  @IsOptional() @IsArray() visitorIds?: number[];
}
