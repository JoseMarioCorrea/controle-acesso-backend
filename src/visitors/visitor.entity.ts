// src/visitors/visitor.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Grupo } from '../groups/grupo.entity';

@Entity('visitantes')
export class Visitante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ nullable: true })
  documentType?: string;

  @Column({ nullable: true })
  rg?: string;

  @Column({ nullable: true })
  cpf?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  @Column({ type: 'date', nullable: true })
  shelfLifeDate?: Date;

  @Column({ type: 'time', nullable: true })
  shelfLifeTime?: string;

  @Column({ nullable: true })
  visitorCompany?: string;

  @Column({ type: 'int', nullable: true })
  visitedCompanyId?: number;

  /**
   * Relação de grupos para controle de acesso assíncrono.
   */
  @ManyToMany(() => Grupo, grupo => grupo.visitantes)
  @JoinTable({
    name: 'visitante_grupos',
    joinColumn: { name: 'visitante_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
  })
  grupos: Grupo[];

  /**
   * Caminho da foto salva no disco (opcional).
   */
  @Column({ nullable: true })
  fotoFilename?: string;
}
