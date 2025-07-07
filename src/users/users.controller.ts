// src/users/users.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Express } from 'express';
import { User } from './user.entity';

@Controller('users')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /** POST /users */
  @Post()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  /** GET /users */
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  /** GET /users/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  /** PUT /users/:id */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  /** DELETE /users/:id */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }

  /** POST   /users/:id/fotos         → faz upload de foto */
  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('foto'))
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() foto: Express.Multer.File,
  ): Promise<{ path: string }> {
    const path = await this.usersService.savePhoto(id, foto);
    return { path };
  }

  /** GET    /users/:id/fotos         → lista todas as fotos */
  @Get(':id/fotos')
  listPhotos(@Param('id', ParseIntPipe) id: number): Promise<string[]> {
    return this.usersService.listPhotos(id);
  }

  /** GET    /users/:id/fotos/latest  → retorna a última foto */
  @Get(':id/fotos/latest')
  async latestPhoto(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ path: string }> {
    const path = await this.usersService.getLatestPhoto(id);
    if (!path) throw new NotFoundException('Nenhuma foto encontrada');
    return { path };
  }
}
