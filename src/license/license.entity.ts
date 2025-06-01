// src/license/license.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('license')
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  companyName: string;

  @Column()
  cnpj: string;

  @Column()
  responsible: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
