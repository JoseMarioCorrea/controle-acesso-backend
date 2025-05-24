// src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../departments/department.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  fotoUrl: string;

  @Column()
  senha: string;

  @Column({ nullable: true })
  cartaoRfid: string;

  @Column({ nullable: true })
  biometriaFacialId: string;

  @ManyToOne(() => Department, (depto) => depto.usuarios)
  departamento: Department;

  @Column({ default: false })
  isMaster: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
