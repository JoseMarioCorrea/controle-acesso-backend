// src/schedules/schedule.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  diaSemana: string; // segunda, terça, etc.

  @Column()
  horaInicio: string; // formato "HH:mm"

  @Column()
  horaFim: string; // até "23:59"
}
