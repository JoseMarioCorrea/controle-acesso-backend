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

@Module({
  imports: [
    /* Config global (ainda pode usar env se quiser) */
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),

    /* TypeORM — fábrica com baseDir dinâmico */
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const runningInPkg = typeof (process as any).pkg !== 'undefined';
        const baseDir = runningInPkg ? dirname(process.execPath) : __dirname;

        return {
          type: 'sqlite',
          database: join(baseDir, 'data', 'controle_acesso.sqlite'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          autoLoadEntities: true,
          logging: false,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
