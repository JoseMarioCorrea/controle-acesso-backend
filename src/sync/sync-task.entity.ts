// src/sync/sync-task.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SyncTaskState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED',
}

export enum SyncOperation {
  CREATE_OR_UPDATE_USER = 'CREATE_OR_UPDATE_USER',
  UPLOAD_PHOTO = 'UPLOAD_PHOTO',
  TEST_PHOTO = 'TEST_PHOTO',
  DELETE_USER = 'DELETE_USER',
  RECONCILE_USER = 'RECONCILE_USER',
}

export enum SyncTargetType {
  PESSOA = 'PESSOA',
  VISITANTE = 'VISITANTE',
}

export type ErrorCategory =
  | 'TRANSIENT'
  | 'PERMANENT'
  | 'AUTH'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | null;

/**
 * Task de sincronização genérica.
 */
@Entity('sync_tasks')
@Index(['state', 'scheduledAt'])
@Index(['targetType', 'targetId'])
export class SyncTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-enum', enum: SyncTargetType })
  targetType: SyncTargetType;

  @Column({ type: 'text' })
  targetId: string;

  @Column({ type: 'simple-enum', enum: SyncOperation })
  operation: SyncOperation;

  @Column({ type: 'simple-enum', enum: SyncTaskState, default: SyncTaskState.PENDING })
  state: SyncTaskState;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 5 })
  maxAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lockedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  errorCategory: ErrorCategory;

  @Column({ type: 'int', nullable: true })
  lastStatusCode: number | null;

  @Column({ type: 'json', nullable: true })
  payload: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
