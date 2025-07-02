// src/departments/department.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Visitante } from '../visitors/visitor.entity';
import { Terminal } from '../terminals/terminal.entity';
import { Grupo } from '../groups/grupo.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  // vínculo com o terminal
  @Column()
  terminalId: number;

  @ManyToOne(() => Terminal, (t: Terminal) => t.departments, { eager: true })
  terminal: Terminal;

  // Pessoas do sistema vinculadas
  @ManyToMany(() => User, (u) => u.departamento, { cascade: true })
  @JoinTable({ name: 'department_users' })
  usuarios: User[];

  // Visitantes vinculados
  @ManyToMany(() => Visitante, (v) => v.departmento, { cascade: true })
  @JoinTable({ name: 'department_visitors' })
  visitantes: Visitante[];

  @OneToMany(() => Grupo, (grupo) => grupo.department)
  grupos: Grupo[];
}
