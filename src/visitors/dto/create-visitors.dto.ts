// src/visitors/dto/create-visitor.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ArrayUnique,
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
} from 'class-validator';

/**
 * DTO de criação de Visitante.
 *
 * - `nome` obrigatório.
 * - `selectedGroups` obrigatório (≥1).
 * - `observacoes` (não `comments`) — alinhado com a entidade Visitante.
 * - `departmentId` opcional: o frontend está enviando; portanto precisa
 *   constar aqui para não disparar "property ... should not exist" quando
 *   o ValidationPipe está com `forbidNonWhitelisted:true`.
 *   Se não vier, o service pode inferir a partir do 1º grupo.
 */
export class CreateVisitorDto {
  /* Nome ----------------------------------------------------------- */
  @IsString()
  @IsNotEmpty()
  nome!: string;

  /* Tipo documento (RG/CPF/etc) ------------------------------------ */
  @IsOptional()
  @IsString()
  documentType?: string;

  /* RG ------------------------------------------------------------- */
  @IsOptional()
  @IsString()
  rg?: string;

  /* CPF ------------------------------------------------------------ */
  @IsOptional()
  @IsString()
  cpf?: string;

  /* Empresa do visitante ------------------------------------------- */
  @IsOptional()
  @IsString()
  visitorCompany?: string;

  /* Telefone ------------------------------------------------------- */
  @IsOptional()
  @IsString()
  phone?: string;

  /* E-mail --------------------------------------------------------- */
  @IsOptional()
  @IsEmail()
  email?: string;

  /* Observações ---------------------------------------------------- */
  @IsOptional()
  @IsString()
  observacoes?: string;

  /* Data de validade ----------------------------------------------- */
  @IsOptional()
  @IsString()
  shelfLifeDate?: string;

  /* Hora de validade ----------------------------------------------- */
  @IsOptional()
  @IsString()
  shelfLifeTime?: string;

  /* DepartamentId (opcional; ver nota acima) ---------------------- */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  /* IDs dos grupos ------------------------------------------------- */
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  selectedGroups!: number[];

  /* Empresa visitada (opcional) ------------------------------------ */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  visitedCompanyId?: number;
}
