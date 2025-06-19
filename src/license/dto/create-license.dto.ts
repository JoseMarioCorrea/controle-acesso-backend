// src/license/dto/create-license.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateLicenseDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  companyName: string;

  @IsNotEmpty()
  cnpj: string;

  @IsNotEmpty()
  responsible: string;
}
