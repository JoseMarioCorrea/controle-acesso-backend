// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Department } from '../departments/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Department])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
