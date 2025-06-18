import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IdfaceService } from "src/devices/idface.service";
import { Repository } from "typeorm";
import { Visitante } from "./visitor.entity";
import { CreateVisitorDto } from "./dto/create-visitors.dto";
import { UpdateVisitorDto } from "./dto/update-visitor.dto";

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
    private readonly idface: IdfaceService,
  ) { }

  async create(dto: CreateVisitorDto): Promise<Visitante> {
    console.log('DTO recebido:', dto);

    const { ...rest } = dto;
    const visitante = this.visitorRepo.create(rest);
    const saved = await this.visitorRepo.save(visitante);
    console.log('Visitante salvo:', saved);

    if (!dto.terminalId) throw new Error('terminalId é obrigatório');

    // Certifique-se de que 'saved' é um objeto, não um array
    if (Array.isArray(saved)) {
      throw new Error('Erro interno: múltiplos visitantes salvos, esperado apenas um.');
    }

    if (!dto.nome?.trim()) {
      throw new Error('Nome do visitante é obrigatório para o cadastro no iDFace');
    }

    await this.idface.login(dto.terminalId, 'admin', 'admin');
    await this.idface.createUserOnDevice(dto.terminalId, dto.nome, dto.matricula);

    return saved;
  }

  async findAll(): Promise<Visitante[]> {
    return this.visitorRepo.find();
  }

  async remove(id: number, terminalId: number): Promise<void> {
    const visitante = await this.visitorRepo.findOne({ where: { id } });
    if (!visitante) throw new NotFoundException('Visitante não encontrado');

    await this.visitorRepo.remove(visitante);

    await this.idface.login(terminalId, 'admin', 'admin');
    await this.idface.deleteUserFromDevice(terminalId, id);
  }

  async findById(id: number): Promise<Visitante> {
    return this.visitorRepo.findOneOrFail({ where: { id } });
  }

  async update(id: number, dto: UpdateVisitorDto): Promise<Visitante> {
    const visitante = await this.visitorRepo.findOne({ where: { id } });
    if (!visitante) {
      throw new NotFoundException('Visitante não encontrado');
    }

    const { terminalId, shelfLifeDate, shelfLifeTime, ...rest } = dto;
    Object.assign(visitante, rest as Partial<Visitante>);
    const updated = await this.visitorRepo.save(visitante);

    if (terminalId) {
      await this.idface.login(terminalId, 'admin', 'admin');
      // Ajusta validade no iDFace
      const endTimestamp = Math.floor(new Date(`${shelfLifeDate}T${shelfLifeTime}`).getTime() / 1000);
      await this.idface.modifyObjects(terminalId, {
        object: 'users',
        values: { begin_time: 0, end_time: endTimestamp },
        where: { users: { id: updated.id } },
      });
    }

    return updated;
  }
}