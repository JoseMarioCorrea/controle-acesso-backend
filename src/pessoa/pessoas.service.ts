// src/pessoa/pessoas.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PessoasService {
  idfaceService: any;
  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
  ) { }

  async create(dto: CreatePessoaDto, foto?: Express.Multer.File): Promise<Pessoa> {
    const novaPessoa = this.repo.create(dto);

    if (foto) {
      const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${foto.originalname}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, foto.buffer);

      novaPessoa.fotoUrl = `uploads/${fileName}`;
    }

    return this.repo.save(novaPessoa);
  }
  async findAll(): Promise<Pessoa[]> {
    return this.repo.find(); // ajuste conforme seu repositório
  }
  async delete(id: number): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });

    if (!pessoa) {
      throw new Error('Pessoa não encontrada');
    }

    // Remove do iDFace se tiver user_id associado
    if (pessoa.userIdIdface) {
      await this.idfaceService.login();
      await this.idfaceService.deleteUserIdface(pessoa.userIdIdface);
    }

    await this.repo.delete(id);
  }

}
