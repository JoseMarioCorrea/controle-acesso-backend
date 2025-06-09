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
dotenv.config();

console.log('MySQL config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  pass: process.env.DB_PASSWORD,
  db: process.env.DB_DATABASE,
});

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
      autoLoadEntities: true,
      entities: [User, Department, Schedule, Holiday, Pessoa],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

