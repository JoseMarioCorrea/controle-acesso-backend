import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nome: string;

  @Column()
  senha: string; // hash or plain

  @Column({ default: false })
  isMaster: boolean;
}