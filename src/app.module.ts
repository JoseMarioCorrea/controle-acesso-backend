import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { SchedulesModule } from './schedules/schedules.module';
import { HolidaysModule } from './holidays/holidays.module';
import { AlarmsModule } from './alarms/alarms.module';
import { ReportsModule } from './reports/reports.module';
import { SystemModule } from './system/system.module';
import { NetworkModule } from './network/network.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Department } from './departments/department.entity';
import { Schedule } from './schedules/schedule.entity';
import { Holiday } from './holidays/holiday.entity';
import { IdfaceModule } from './devices/idface.module';
import * as dotenv from 'dotenv';
import { Pessoa } from './pessoa/pessoa.entity';
import { PessoaModule } from './pessoa/pessoa.module';
import { LicenseModule } from './license/license.module';
import { TerminalsModule } from './terminals/terminals.module';
import { VisitorModule } from './visitors/visitors.module';
import { Visitante } from './visitors/visitor.entity';
import { Terminal } from './terminals/terminal.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import './polyfill';
dotenv.config();

console.log('MySQL config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  pass: process.env.DB_PASSWORD,
  db: process.env.DB_DATABASE,
});

@Module({
  imports: [
    // 1) ConfigModule carrega suas configs (e variáveis de ambiente se houver um .env)
    ConfigModule.forRoot({
      isGlobal: true,
      // se você quiser ler também de um .env, remova ou ajuste ignoreEnvFile
      ignoreEnvFile: true,
      load: [() => ({
        DB_TYPE: 'sqlite',
        DB_DATABASE: './data/controle_acesso.sqlite',
        IDFACE_BASE_URL: 'http://192.168.18.55',
      })],
    }),
    // 2) TypeORM usando forRootAsync para injetar o ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<'sqlite'>('DB_TYPE'),
        database: config.get<string>('DB_DATABASE'),
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
        ],
        synchronize: true,
        autoLoadEntities: true,
        dropSchema: false,     // cuidado: apaga o banco a cada start
        // logging: true,
      }),
    }),
    UsersModule,
    DepartmentsModule,
    SchedulesModule,
    HolidaysModule,
    AlarmsModule,
    ReportsModule,
    SystemModule,
    NetworkModule,
    AuthModule,
    IdfaceModule,
    PessoaModule,
    LicenseModule,
    TerminalsModule,
    VisitorModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

