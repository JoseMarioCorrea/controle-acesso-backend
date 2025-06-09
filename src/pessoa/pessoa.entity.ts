// src/pessoa/pessoa.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Grupo } from '../groups/grupo.entity';

@Entity()
export class Pessoa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 20, nullable: true })
  matricula: string;

  // Se houver integração com iDFace, armazenamos o ID retornado aqui
  @Column({ type: 'int', nullable: true })
  userIdIdface: number | null;

  @Column({ length: 20, nullable: true })
  rg: string;

  @Column({ length: 14, nullable: true })
  cpf: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ length: 100, nullable: true })
  senha: string;

  @Column({ length: 255, nullable: true })
  observacoes: string;

  @Column({ default: false })
  administrador: boolean;

  @Column({ default: false })
  inativo: boolean;

  @Column({ default: false })
  listaExcecao: boolean;

  // URL relativa para a foto (se enviada)
  @Column({ nullable: true })
  fotoUrl: string;

  // Se a sincronização com iDFace falhar, marcamos como pendente
  @Column({ default: false })
  pendenteIdface: boolean;

  @Column({ default: 0 })
  creditos: number;

  @ManyToMany(() => Grupo, (grupo) => grupo.pessoas, { cascade: true })
  grupos: Grupo[];

  @Column({ nullable: true })
  idfaceId: number;    // ID no equipamento iDFace

  @Column ({default: false})
  isVisitante: boolean;
}
