// src/users/dto/create-user.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Column } from 'typeorm';

export class CreateUserDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsString()
  senha: string;

  @IsOptional()
  @IsString()
  cartaoRfid?: string;

  @IsOptional()
  @IsString()
  biometriaFacialId?: string;

  @IsOptional()
  departamentoId?: number;

  @IsBoolean()
  @IsOptional()
  isMaster?: boolean;

  @IsOptional()
  @IsNumber()
  terminalId?: number;

  @IsBoolean()
  @IsOptional()
  released?: boolean;
}
