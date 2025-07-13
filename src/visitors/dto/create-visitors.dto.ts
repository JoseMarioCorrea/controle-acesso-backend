// src/visitors/dto/createVisitor.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ArrayUnique,
  IsInt,
  IsNotEmpty,
} from 'class-validator';

export class CreateVisitorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  idUsuario?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  visitorCompany?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  shelfLifeDate?: string;

  @IsOptional()
  @IsString()
  shelfLifeTime?: string;

  /** IDs dos grupos aos quais esse visitante pertence */
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  selectedGroups: number[];

  /** (Opcional) ID da empresa visitada */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  visitedCompanyId?: number;
}
