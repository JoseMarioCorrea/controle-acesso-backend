// src/idface/idface.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IdfaceService } from './idface.service';
import { IdfaceController } from './idface.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Terminal } from 'src/terminals/terminal.entity';
import { TerminalsModule } from 'src/terminals/terminals.module';

@Module({
  imports: [
    ConfigModule,
    TerminalsModule, // para pegar IDFACE_BASE_URL e DEVICE_ID do .env
    Terminal,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        baseURL: cfg.get<string>('IDFACE_BASE_URL'),
        timeout: 5000,
      }),
    }),
  ],
  providers: [IdfaceService],
  controllers: [IdfaceController],
  exports: [IdfaceService],
})
export class IdfaceModule {}
