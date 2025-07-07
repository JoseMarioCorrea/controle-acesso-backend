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
import { Department } from '../departments/department.entity';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  /** aqui: cada grupo pertence a exatamente um departamento */
  @ManyToOne(() => Department, (dept) => dept.grupos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column()
  department_id: number;

  /**
   * Relação ManyToMany com Pessoa.
   * O @JoinTable fica apenas de um lado (Grupo),
   * criando a tabela de junção `pessoa_grupos`.
   */
  @ManyToMany(() => Pessoa, (pessoa) => pessoa.selectedGroups)
  @JoinTable({
    name: 'pessoa_grupos',
    joinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'pessoa_id', referencedColumnName: 'id' },
  })
  pessoas: Pessoa[];
}
