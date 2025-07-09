// src/visitors/visitors.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdfaceService } from '../devices/idface.service';
import { VisitorPhotoService } from './visitorPhoto.service';
import { Repository } from 'typeorm';
import { Visitante } from './visitor.entity';
import { CreateVisitorDto } from './dto/create-visitors.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { Express } from 'express';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitante)
    private readonly visitorRepo: Repository<Visitante>,
    private readonly idface: IdfaceService,
    private readonly photoSvc: VisitorPhotoService,
  ) { }

  async create(dto: CreateVisitorDto, file?: Express.Multer.File): Promise<Visitante> {
    if (dto.terminalId == null) {
      throw new BadRequestException('terminalId é obrigatório');
    }

    // cria sem foto primeiro
    const visitante = this.visitorRepo.create({ ...dto });
    const saved = await this.visitorRepo.save(visitante);

    // se veio arquivo, salva no disco e atualiza o registro
    if (file) {
      try {
        const url = await this.photoSvc.savePhoto(saved.id, file);
        saved.foto = url;
        await this.visitorRepo.save(saved);
      } catch (err) {
        throw new InternalServerErrorException('Falha ao salvar foto', err.message);
      }
    }

    // empurra pro device
    await this.idface.login(dto.terminalId, 'admin', 'admin');
    await this.idface.createUserOnDevice(dto.terminalId, dto.nome);

    return saved;
  }

  async findAll(): Promise<Visitante[]> {
    return this.visitorRepo.find();
  }
  // cria este helper
  async findByIdFace(userIdIdface: number) {
    const v = await this.visitorRepo.findOne({ where: { userIdIdface } });
    if (!v) throw new NotFoundException('Não achei visitor pelo idface');
    return v;
  }

  async updateByIdFace(idface: number, dto: UpdateVisitorDto, file?: Express.Multer.File) {
    const v = await this.findByIdFace(idface);
    return this.update(v.id, dto, file);
  }

  async findById(id: number): Promise<Visitante> {
    return this.visitorRepo.findOneOrFail({ where: { id } });
  }

  async update(
    id: number,
    dto: UpdateVisitorDto,
    file?: Express.Multer.File,
  ): Promise<Visitante> {
    const visitante = await this.visitorRepo.findOne({ where: { id } });
    if (!visitante) throw new NotFoundException('Visitante não encontrado');

    Object.assign(visitante, dto);
    await this.visitorRepo.save(visitante);

    if (file) {
      try {
        const url = await this.photoSvc.savePhoto(id, file);
        visitante.foto = url;
        await this.visitorRepo.save(visitante);
      } catch (err) {
        throw new InternalServerErrorException('Falha ao atualizar foto', err.message);
      }
    }

    return this.visitorRepo.findOneOrFail({ where: { id } });
  }

  async remove(id: number, terminalId: number): Promise<void> {
    const visitante = await this.visitorRepo.findOne({ where: { id } });
    if (!visitante) throw new NotFoundException('Visitante não encontrado');

    await this.visitorRepo.remove(visitante);
    await this.idface.login(terminalId, 'admin', 'admin');
    await this.idface.deleteUserFromDevice(terminalId, visitante.userIdIdface);
  }
}
