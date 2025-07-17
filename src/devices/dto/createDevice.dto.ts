// src/devices/dto/create-device.dto.ts
import { IsNotEmpty, IsString, IsIP, IsInt, Min } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty() 
  @IsString()
  name: string;

  @IsNotEmpty() 
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsIP()
  ip: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  port: number;

  @IsInt()
  @Min(1) // opcional, se usado
  departmentId?: number; // vincula a um departamento, se necessário  
}
