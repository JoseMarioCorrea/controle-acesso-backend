// src/license/license.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { LicenseService } from './license.service';
import { CreateLicenseDto } from './dto/create-license.dto';

@Controller('api/license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post('signUp')
  async signUp(@Body() dto: CreateLicenseDto) {
    const saved = await this.licenseService.create(dto);
    return {
      message: 'Registro salvo com sucesso!',
      data: saved,
    };
  }
}
