// src/departments/departamento.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Grupo } from '../groups/grupo.entity';
import { Device } from '../devices/idaface.entity';

@Entity('departments')
export class Departament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @OneToMany(() => Grupo, grupo => grupo.department)
  grupos: Grupo[];

  @OneToMany(() => Device, device => device.department)
  devices: Device[];
}
