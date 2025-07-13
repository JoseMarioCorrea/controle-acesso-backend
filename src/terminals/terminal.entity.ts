// src/idface/entities/terminal.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Departament } from '../departments/department.entity';

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

  // marca este terminal como ativo/inativo
  @Column({ default: true })
  active: boolean;

  // ligação inversa: um terminal para muitos departamentos
  @OneToMany(() => Departament, (dept) => dept.devices)
  departments: Departament[];
}
