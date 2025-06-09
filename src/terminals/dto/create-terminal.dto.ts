// src/terminals/dto/create-terminal.dto.ts
import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateTerminalDto {
  @IsString() name: string;
  @IsString() host: string;
  @IsInt() @Min(1) port: number;
  @IsOptional() @IsString() model?: string;
}
