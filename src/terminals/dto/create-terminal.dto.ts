// src/idface/dto/create-terminal.dto.ts
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateTerminalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  model: string;
  
}
