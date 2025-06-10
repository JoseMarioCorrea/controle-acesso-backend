import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('visitantes')
export class Visitante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ nullable: true })
  visitor_rg: string;

  @Column({ nullable: true })
  visitor_cpf: string;

    @Column({ nullable: true })
  rg: string;

  @Column({ nullable: true })
  cpf: string;

  @Column({ nullable: true })
  phone: string;

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

  @Column({ type: 'int', nullable: true }) // ✅ CORRETO!
  terminalId: number;
}
