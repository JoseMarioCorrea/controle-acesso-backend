// src/users/dto/create-user.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  nome: string;

  @IsString()
  idUsuario: number;


  @IsOptional()
  @IsString()
  fotoUrl?: string;

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
}
