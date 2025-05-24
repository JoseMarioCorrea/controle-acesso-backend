// src/holidays/holiday.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Holiday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ type: 'date' })
  data: string;

  @Column()
  tipo: string; // nacional, municipal etc.

  @Column({ default: false })
  repeteAnualmente: boolean;
}
