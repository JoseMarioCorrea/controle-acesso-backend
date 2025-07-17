// src/auth/dto/login.dto.ts
import { IsBoolean, isBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  senha: string;

  @IsOptional()
  @IsBoolean()
  isMaster?: boolean;
}