// src/terminals/terminals.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Terminal } from './terminal.entity';
import { TerminalsService } from './terminals.service';
import { TerminalsController } from './terminals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Terminal])],
  providers: [TerminalsService],
  controllers: [TerminalsController],
})
export class TerminalsModule {}
