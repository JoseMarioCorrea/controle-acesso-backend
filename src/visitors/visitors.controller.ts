// src/pessoa/visitors.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisitorsService } from './visitors.service';
import { CreatePessoaDto } from '../pessoa/dto/createPessoa.dto';
import { UpdatePessoaDto } from '../pessoa/dto/updatePessoa.dto';
import { Visitante } from './visitor.entity';
import { Express } from 'express';
import { CreateVisitorDto } from './dto/create-visitors.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Controller('visitors')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  async create(
    @UploadedFile() foto: Express.Multer.File,
    @Body() dto: CreateVisitorDto,
  ): Promise<Visitante> {
    return this.visitorsService.create(dto, foto);
  }

  @Get()
  async findAllVisitors(): Promise<Visitante[]> {
    const all = await this.visitorsService.findAll();
    return all;
  }

  @Get(':id')
  async findVisitorById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Visitante> {
    const visitante = await this.visitorsService.findById(id);
    if (visitante == null) {
      throw new Error('Visitante não encontrado');
    }
    return visitante;
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('foto'))
  async updateVisitor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePessoaDto,
    @UploadedFile() foto?: Express.Multer.File,
  ): Promise<Visitante> {
    const payload = { ...dto, isVisitante: true };
    return this.visitorsService.update(id, payload, foto);
  }

  @Delete(':id/:terminalId')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('terminalId', ParseIntPipe) terminalId: number,
  ) {
    return this.visitorsService.remove(id, terminalId);
  }

  @Get('idface/:idface')
  findByIdFace(
    @Param('idface', ParseIntPipe) idface: number,
  ) {
    return this.visitorsService.findByIdFace(idface);
  }

  @Put('idface/:idface')
  @UseInterceptors(FileInterceptor('foto'))
  updateByIdFace(
    @Param('idface', ParseIntPipe) idface: number,
    @Body() dto: UpdateVisitorDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.visitorsService.updateByIdFace(idface, dto, file);
  }

}
