import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Pessoa } from '../pessoa/pessoa.entity';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  /**
   * Relação ManyToMany com Pessoa.
   * O @JoinTable fica apenas de um lado (Grupo),
   * criando a tabela de junção `pessoa_grupos`.
   */
  @ManyToMany(() => Pessoa, (pessoa) => pessoa.grupos)
  @JoinTable({
    name: 'pessoa_grupos',
    joinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'pessoa_id', referencedColumnName: 'id' },
  })
  pessoas: Pessoa[];
}
