import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  IsNumber,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  idUsuario?: string;

  // RG ou CPF do visitante
  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  // Caso queira guardar o nome da empresa (não obrigatório se usar visitedCompanyId)
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

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  selectedGroups?: number[];

  @Type(() => Number)
  @IsInt({ message: 'terminalId deve ser um número inteiro' })
  terminalId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userIdIdface?: number;

  // ID da empresa que será visitada, se aplicável
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  visitedCompanyId?: number;
}
