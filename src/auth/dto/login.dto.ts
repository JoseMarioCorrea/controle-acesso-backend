// src/auth/dto/login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  senha: string;
}