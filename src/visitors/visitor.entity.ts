import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('visitantes')
export class Visitante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nome: string;

  @Column({ nullable: true })
  rg: string;

  @Column({ nullable: true })
  cpf: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  observacoes: string;

  @Column({ nullable: true })
  validade: string;

  @Column({ nullable: true })
  visitorCompany: string;

  @Column({ nullable: true })
  visitedCompanyName: string;

  @Column({ nullable: true })
  shelfLifeDate: string;

  @Column({ nullable: true })
  shelfLifeTime: string;

  @Column({ nullable: true })
  matricula: string;
}
