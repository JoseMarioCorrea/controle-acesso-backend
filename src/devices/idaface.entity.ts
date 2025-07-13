// src/devices/device.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Departament } from '../departments/department.entity';

@Entity('idface')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 45 })
  ip: string;

  @Column('int')
  port: number;
  
  @ManyToOne(() => Departament, dept => dept.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departmentId' })
  department: Departament;

  @Column()
  departmentId: number;
}
