// src/license/license.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './license.entity';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Module({
  imports: [TypeOrmModule.forFeature([License])],
  providers: [LicenseService],
  controllers: [LicenseController],
})
export class LicenseModule {}
