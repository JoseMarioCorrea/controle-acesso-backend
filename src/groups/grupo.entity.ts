// src/grupos/grupo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Pessoa } from '../pessoa/pessoa.entity';
import { Departament } from '../departments/department.entity';
import { Visitante } from 'src/visitors/visitor.entity';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  /** aqui: cada grupo pertence a exatamente um departamento */
  @ManyToOne(() => Departament, (dept) => dept.grupos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departmentId' })
  department: Departament;

  @Column()
  departmentId: number;

  @ManyToMany(() => Pessoa, (pessoa) => pessoa.grupos)
  pessoas: Pessoa[];

  @ManyToMany(() => Visitante, visitante => visitante.grupos)
  visitantes: Visitante[];
}
