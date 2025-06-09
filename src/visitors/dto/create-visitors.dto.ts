import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class CreateVisitorDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  visitorCompany?: string;

  @IsOptional()
  @IsString()
  visitedCompanyName?: string;

  @IsOptional()
  @IsString()
  shelfLifeDate?: string;

  @IsOptional()
  @IsString()
  shelfLifeTime?: string;

  @IsOptional()
  @IsString()
  visitor_rg?: string;

  @IsOptional()
  @IsString()
  visitor_cpf?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  comments?: string;
  @IsOptional()
  @IsNumber()
  terminalId?: number;
}
