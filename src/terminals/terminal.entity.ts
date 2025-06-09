// src/terminals/terminal.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('terminals')
export class Terminal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column({ nullable: true })
  model: string;

  @Column({ default: 'Offline' })
  status: string;
}
