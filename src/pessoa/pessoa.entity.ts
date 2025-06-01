// src/pessoa/pessoa.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Pessoa {
  @PrimaryGeneratedColumn() id: number;

  @Column() nome: string;
  @Column() matricula: string;

  @Column({ nullable: true }) idUsuario?: string;
  @Column({ nullable: true }) rg?: string;
  @Column({ nullable: true }) cpf?: string;
  @Column({ nullable: true }) email?: string;
  @Column({ nullable: true }) telefone?: string;
  @Column({ nullable: true }) senha?: string;
  @Column({ nullable: true }) observacoes?: string;

  @Column({ default: false }) administrador: boolean;
  @Column({ default: false }) inativo: boolean;
  @Column({ default: false }) listaExcecao: boolean;

  @Column({ nullable: true }) fotoUrl?: string;

  @Column({ nullable: true }) userIdIdface?: number;
}
// Note: The `@Column()` decorator is used to define the columns in the database table.
// The `@PrimaryGeneratedColumn()` decorator is used to define the primary key of the table.