// src/pessoa/pessoa.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pessoa')
export class Pessoa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  matricula: string;

  @Column()
  cpf: string;

  @Column()
  email: string;

  @Column()
  telefone: string;

  @Column()
  senha: string;

  @Column({ nullable: true })
  fotoUrl: string;

  @Column({ nullable: true })
  userIdIdface: number;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
  idfaceUserId: any;
}
