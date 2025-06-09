// src/pessoa/dto/createPessoa.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  ArrayUnique,
  IsInt,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Column } from 'typeorm';

export class CreatePessoaDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  // Este campo virá do front para criar o usuário no iDFace
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userIdIdface?: number;

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
  observacoes?: string;

  // Aplicamos @Type(() => Boolean) para converter "true" → true
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
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  grupos?: number[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisitante?: boolean;


}
