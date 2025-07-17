// src/devices/device.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Departament } from '../departments/department.entity';

@Entity('idface')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  // coluna no BD = nome
  @Column({ name: 'nome', length: 100 })
  name: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 45 })
  ip: string;

  @Column('int')
  port: number;

  @ManyToOne(() => Departament, d => d.devices, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'departmentId' }) // coluna existente na tabela idface
  department?: Departament | null;

  @Column({ nullable: true })
  departmentId?: number | null;
}
