// src/pessoa/pessoa.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Grupo } from '../groups/grupo.entity';
import { Departament } from '../departments/department.entity';

export enum PersonState {
  SALVO = 'SALVO',
  PENDENTE_ENVIO = 'PENDENTE_ENVIO',
  ENVIADO = 'ENVIADO',
  INATIVO = 'INATIVO',
  EXCLUIDO_DEVICE = 'EXCLUIDO_DEVICE',
}

@Entity('pessoa')
export class Pessoa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  documentType?: string;

  @Column({ nullable: true })
  matricula?: string;

  @Column({ nullable: true })
  rg?: string;

  @Column({ nullable: true })
  cpf?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  telefone?: string;

  @Column({ nullable: true })
  observacoes?: string;

  @Column({ type: 'date', nullable: true })
  shelfLifeDate?: Date;

  @Column({ nullable: true })
  fotoFilename?: string;

  /** Estado no fluxo de sincronização */
  @Column({
    type: 'simple-enum',
    enum: PersonState,
    default: PersonState.SALVO,
  })
  state: PersonState;

  /** Vinculação ao departamento (pai dos devices) */
  @ManyToOne(() => Departament, { nullable: false })
  @JoinColumn({ name: 'departmentId' })
  department: Departament;

  /** Grupos (ManyToMany) */
  @ManyToMany(() => Grupo)
  @JoinTable({
    name: 'pessoa_grupos',
    joinColumn: { name: 'pessoa_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
  })
  grupos: Grupo[];

  /** Flags de controle */
  @Column({ default: false })
  administrador: boolean;

  @Column({ default: false })
  inativo: boolean;

  @Column({ default: false })
  listaExcecao: boolean;

  @Column({ default: false })
  visitante: boolean;
}
