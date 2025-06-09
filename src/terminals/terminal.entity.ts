// src/idface/entities/terminal.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('terminais')
export class Terminal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  host: string;

  @Column({ default: 80 })
  port: number;

  @Column()
  model: string;
}
