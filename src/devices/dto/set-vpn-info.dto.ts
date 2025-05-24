import { IsString, IsNumber } from 'class-validator';

export class SetVPNInfoDto {
  @IsString()
  server: string;

  @IsNumber()
  port: number;

  @IsString()
  proto: string;

  @IsString()
  username: string;

  @IsString()
  password: string;
}
