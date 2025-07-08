// src/pessoa/dto/createPessoa.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  IsArray,
  ArrayUnique,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePessoaDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userIdIdface?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  senha?: string;

  @IsOptional()
  @IsString()
  confirmarSenha?: string;

  @IsOptional()
  @IsString()
  idUsuario?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  /** IDs dos grupos (ManyToMany) */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  grupos?: number[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  administrador?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inativo?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  listaExcecao?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisitante?: boolean;

  @Type(() => Number)
  @IsInt()
  terminalId: number;
}
