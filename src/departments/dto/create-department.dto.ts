// src/departments/dto/create-department.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty() 
  nome: string;

  @IsNumber()
  terminalId: number;

  @IsOptional()
  @IsArray()
  userIds?: number[];

  @IsOptional()
  @IsArray()
  visitorIds?: number[];
}
