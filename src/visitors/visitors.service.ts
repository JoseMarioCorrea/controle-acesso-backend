import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdfaceService } from 'src/devices/idface.service';
import { Repository } from 'typeorm';
import { Visitante } from './visitor.entity';
import { CreateVisitorDto } from './dto/create-visitors.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
    private readonly idface: IdfaceService,
  ) {}

  async create(dto: CreateVisitorDto, filename?: string): Promise<Visitante> {
    // valida terminalId apenas se não vier
    if (dto.terminalId == null) {
      throw new BadRequestException('terminalId é obrigatório');
    }

    const visitante = this.visitorRepo.create({
      ...dto,
      foto: filename,
    });
    const saved = await this.visitorRepo.save(visitante);

    // push pro iDFace
    await this.idface.login(dto.terminalId, 'admin', 'admin');
    await this.idface.createUserOnDevice(
      dto.terminalId,
      dto.nome,
    );

    return saved;
  }

  async findAll(): Promise<Visitante[]> {
    return this.visitorRepo.find();
  }

  async findById(id: number): Promise<Visitante> {
    return this.visitorRepo.findOneOrFail({ where: { id } });
  }

  async update(
    id: number,
    dto: UpdateVisitorDto,
    filename?: string,
  ): Promise<Visitante> {
    const visitante = await this.visitorRepo.findOne({ where: { id } });
    if (!visitante) throw new NotFoundException('Visitante não encontrado');

    Object.assign(visitante, dto);
    if (filename) visitante.foto = filename;
    await this.visitorRepo.save(visitante);

    // recarrega com a URL da foto
    return this.visitorRepo.findOneOrFail({ where: { id } });
  }

  async remove(id: number, terminalId: number): Promise<void> {
    const visitante = await this.visitorRepo.findOne({ where: { id } });
    if (!visitante) throw new NotFoundException('Visitante não encontrado');
    await this.visitorRepo.remove(visitante);
    await this.idface.login(terminalId, 'admin', 'admin');
    await this.idface.deleteUserFromDevice(terminalId, id);
  }
}
// This service handles the business logic for managing visitors.
// It provides methods to create, retrieve, update, and delete visitor records,     