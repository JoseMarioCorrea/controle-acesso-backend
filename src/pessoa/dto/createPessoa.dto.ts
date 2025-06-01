// src/pessoa/dto/createPessoa.dto.ts
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreatePessoaDto {
  @IsString() nome: string;
  @IsString() matricula: string;
  @IsOptional() @IsString() idUsuario?: string;
  @IsOptional() @IsString() rg?: string;
  @IsOptional() @IsString() cpf?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() senha?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  administrador: boolean;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  inativo: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  listaExcecao: boolean;

  @IsOptional() @IsString() fotoUrl?: string;

  @IsOptional() @IsString() userIdIdface?: number;
}
// Note: The `@IsOptional()` decorator is used to indicate that the field is not required.
// The `@IsString()`, `@IsEmail()`, and `@IsBoolean()` decorators are used to validate the types of the fields.