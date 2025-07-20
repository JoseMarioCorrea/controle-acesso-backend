// src/sync/sync-device-user-map.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SyncTargetType } from './sync-task.entity';

@Entity('sync_device_user_map')
@Index(['targetType', 'targetId'], { unique: true })
export class SyncDeviceUserMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-enum', enum: SyncTargetType })
  targetType: SyncTargetType;

  @Column({ type: 'text' })
  targetId: string;

  @Column({ type: 'int' })
  deviceUserId: number;

  @Column({ type: 'int' })
  deviceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
