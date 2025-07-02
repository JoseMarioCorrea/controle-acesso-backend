// src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Department } from '../departments/department.entity';
import { Grupo } from '../groups/grupo.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  fotoUrl: string;

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

  @ManyToMany(() => Grupo, (grupo) => grupo.pessoas)
  grupos: Grupo[];

  @Column({ default: true })
  released: boolean;
}
