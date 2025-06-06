// src/pessoa/pessoas.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import * as fs from 'fs';
import * as path from 'path';
import { IdfaceService } from '../devices/idface.service'; 

@Injectable()
export class PessoasService {
  constructor(
    @InjectRepository(Pessoa)
    private readonly repo: Repository<Pessoa>,
    private readonly idfaceService: IdfaceService, // injete aqui seu serviço de iDFace
  ) {}

  /**
   * Cria nova Pessoa. Tenta primeiro criar no iDFace.
   * Se falhar, marcamos pendenteIdface=true e persistimos a pessoa de qualquer forma.
   */
  async create(
    dto: CreatePessoaDto,
    foto?: Express.Multer.File,
  ): Promise<Pessoa> {
    // 1) Cria instância da entidade sem userIdIdface ainda
    const novaPessoa = this.repo.create({ ...dto });

    // 2) Se houver foto enviada, salva no disco e define novaPessoa.fotoUrl
    if (foto) {
      const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads', 'fotos');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileName = `${Date.now()}-${foto.originalname}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, foto.buffer);
      novaPessoa.fotoUrl = `uploads/fotos/${fileName}`;
    }

    // 3) Se veio userIdIdface no DTO, tenta criar no iDFace
    if (dto.userIdIdface) {
      try {
        // 3.1) Faz login no iDFace
        await this.idfaceService.login();

        // 3.2) Cria o usuário no iDFace, usando o mesmo ID que veio no DTO e o nome da pessoa
        const resultado = await this.idfaceService.createUserIdface(
          dto.userIdIdface,
          novaPessoa.nome,
        );

        // 3.3) Se obtivermos sucesso, gravamos o ID retornado e marcamos pendenteIdface=false
        novaPessoa.userIdIdface = resultado.id;
        novaPessoa.pendenteIdface = false;
      } catch (error) {
        // Se algo falhar (rede, permissão, indisponibilidade), marcamos pendente
        novaPessoa.pendenteIdface = true;
      }
    } else {
      // Se o front não enviou userIdIdface, consideramos como pendente
      novaPessoa.pendenteIdface = true;
    }

    // 4) Persiste a Pessoa no banco (mesmo que pendenteIdface=true)
    try {
      return await this.repo.save(novaPessoa);
    } catch (e) {
      throw new InternalServerErrorException(
        `Erro ao salvar a pessoa: ${e.message}`,
      );
    }
  }

  async findAll(): Promise<Pessoa[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<Pessoa | null> {
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    const pessoa = await this.repo.findOne({ where: { id } });
    if (!pessoa) {
      throw new Error('Pessoa não encontrada');
    }
    // Se existir userIdIdface, remove também do iDFace
    if (pessoa.userIdIdface) {
      await this.idfaceService.login();
      await this.idfaceService.deleteUserIdface(pessoa.userIdIdface);
    }
    await this.repo.delete(id);
  }
}
