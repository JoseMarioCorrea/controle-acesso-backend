// src/users/dto/create-user.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Column } from 'typeorm';

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

  @Column({ default: false })
  isVisitante: boolean;

  @IsBoolean()
  @IsOptional()
  isMaster?: boolean;
}
