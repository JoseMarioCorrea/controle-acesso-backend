// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dirname, join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsModule } from './departments/departments.module';
import { AuthModule } from './auth/auth.modulle';
import { IdfaceModule } from './devices/idface.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { LicenseModule } from './license/license.module';
import { TerminalsModule } from './terminals/terminals.module';
import { VisitorModule } from './visitors/visitors.module';
import './polyfill';
import { SyncModule } from './sync/sync.module';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    /* Config global (ainda pode usar env se quiser) */
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),

    /* TypeORM — fábrica com baseDir dinâmico */
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbDir = join(
          process.env.PROGRAMDATA!,            // C:\ProgramData
          'ControleAcesso', 'data'
        );
        if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

        return {
          type: 'sqlite',
          database: join(dbDir, 'controle_acesso.sqlite'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          autoLoadEntities: true,
          logging: ['error'],   // ativa log pra ver qualquer trava
        };
      },
    }),

    /*  módulos da aplicação */
    DepartmentsModule,
    AuthModule,
    IdfaceModule,
    PessoaModule,
    LicenseModule,
    TerminalsModule,
    VisitorModule,
    SyncModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
