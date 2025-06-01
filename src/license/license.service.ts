// src/license/license.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from './license.entity';
import { CreateLicenseDto } from './dto/create-license.dto';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepo: Repository<License>,
  ) {}

  async create(dto: CreateLicenseDto): Promise<License> {
    const license = this.licenseRepo.create(dto);
    return this.licenseRepo.save(license);
  }

  async findAll(): Promise<License[]> {
    return this.licenseRepo.find();
  }
}
