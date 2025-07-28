// src/pessoa/dto/createPessoa.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  IsArray,
  ArrayUnique,
  IsInt,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO de criação de Pessoa (cadastro base).
 * Atenção: o ValidationPipe global usa whitelist+forbidNonWhitelisted,
 * portanto só envie campos que constam aqui ou ocorrerá 400.
 */
export class CreatePessoaDto {
  /* -------------------------------------------------------------- */
  /* Campos básicos                                                 */
  /* -------------------------------------------------------------- */
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  /**
   * Departamento ao qual a pessoa pertence (obrigatório).
   * ID numérico (FK para departments.id).
   */
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  departmentId: number;              // <- agora sem "?" para refletir obrigatoriedade

  /* Documento ----------------------------------------------------- */
  @IsOptional()
  @IsString()
  documentType?: string;            // 'RG' | 'CPF' ou outro

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  /* Contato ------------------------------------------------------- */
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;                 // se front envia "phone", mapear no controller

  /* Credenciais (se usado) ---------------------------------------- */
  @IsOptional()
  @IsString()
  senha?: string;

  @IsOptional()
  @IsString()
  confirmarSenha?: string;

  /* Observações --------------------------------------------------- */
  @IsOptional()
  @IsString()
  observacoes?: string;

  /* Vigência / validade de acesso -------------------------------- */
  @IsOptional()
  @IsString()
  shelfLifeDate?: string;            // 'YYYY-MM-DD'; será convertido no service se necessário

  /* -------------------------------------------------------------- */
  /* Relacionamentos                                                */
  /* -------------------------------------------------------------- */
  /** IDs dos grupos (ManyToMany). Opcional no cadastro. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  grupos?: number[];

  /* -------------------------------------------------------------- */
  /* Flags                                                          */
  /* -------------------------------------------------------------- */
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

  /** se true, aplica lógica de Visitante (grupo genérico etc.) */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  visitante?: boolean;
}
