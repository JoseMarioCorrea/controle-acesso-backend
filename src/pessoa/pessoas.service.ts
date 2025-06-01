// src/pessoa/pessoas.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import * as fs from 'fs';
import * as path from 'path';
import { error } from 'console';

@Injectable()
export class PessoasService {
  [x: string]: any;
  idfaceService: any;
  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
  ) { }

  async create(dto: CreatePessoaDto, foto?: Express.Multer.File, userIdIdface?: number): Promise<Pessoa> {
    const novaPessoa = this.repo.create({ ...dto, userIdIdface });

    if (foto) {
      const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads/fotos');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const fileName = `${Date.now()}-${foto.originalname}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, foto.buffer);

      novaPessoa.fotoUrl = `uploads/fotos/${fileName}`;
    }
    if (dto.userIdIdface) {
      try {
        await this.idfaceService.login();
        const userIdface = await this.idfaceService.createUserIdface(dto.userIdIdface, novaPessoa.nome);
        novaPessoa.userIdIdface = userIdface.id;
        return this.repo.save(novaPessoa);
      } catch (error) {
        throw new Error('Erro ao salvar a pessoa: ' + error.message);
      }
    } else {
      throw new Error('Erro ao salvar a pessoa: ' + 'userIdIdface não fornecido');

    }
  }

  async findAll(): Promise<Pessoa[]> {
    return this.repo.find(); // ajuste conforme seu repositório
  }

  async findById(id: number): Promise<Pessoa | null> {
    return this.repo.findOne({ where: { id } });
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
