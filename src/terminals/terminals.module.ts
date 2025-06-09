// src/idface/terminals.module.ts ou src/terminals/terminals.module.ts
import { Module } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { TerminalsController } from './terminals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Terminal } from './terminal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Terminal])],
  providers: [TerminalsService],
  controllers: [TerminalsController],
  exports: [TerminalsService], // 👈 ESSENCIAL para outros módulos
})
export class TerminalsModule {}
