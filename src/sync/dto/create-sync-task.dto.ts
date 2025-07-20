// src/sync/dto/create-sync-task.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { SyncOperation, SyncTargetType } from '../sync-task.entity';

export class CreateSyncTaskDto {
  @IsEnum(SyncTargetType)
  targetType: SyncTargetType;

  @IsString()
  targetId: string;

  @IsEnum(SyncOperation)
  operation: SyncOperation;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  payload?: any;
}

export class RequeueSyncTaskDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | Date;
}
