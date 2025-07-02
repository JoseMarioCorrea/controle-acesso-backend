// src/idface/dto/set-user.dto.ts
import { IsInt, IsOptional } from 'class-validator';

export class SetUserAuthenticationDto {
  @IsInt() user_id: number;
  @IsInt() auth_mode: number;
  @IsOptional() @IsInt() device_id?: number;
}

export class SetUserDeviceDto {
  @IsInt() user_id: number;
  @IsOptional() @IsInt() device_id?: number;
}

export class SetUserGroupDto {
  @IsInt() user_id: number;
  @IsInt() group_id: number;
  @IsOptional() @IsInt() device_id?: number;
}

export class SetUserAccessScheduleDto {
  @IsInt() user_id: number;
  @IsInt() schedule_id: number;
  @IsOptional() @IsInt() device_id?: number;
}

export class DeleteUserDto {
  @IsInt() user_id: number;
  @IsOptional() @IsInt() device_id?: number;
}
