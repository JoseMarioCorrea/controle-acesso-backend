import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsInt,
} from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  visitor_rg?: string;

  @IsOptional()
  @IsString()
  visitor_cpf?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  validade?: string;

  @IsOptional()
  @IsString()
  visitorCompany?: string;

  @IsOptional()
  @IsString()
  visitedCompanyName?: string;

  @IsOptional()
  @IsString()
  shelfLifeDate?: string;

  @IsOptional()
  @IsString()
  shelfLifeTime?: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsString()
  comments: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  terminalId: number;
}
