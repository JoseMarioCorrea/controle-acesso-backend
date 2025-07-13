// src/devices/dto/update-device.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceDto } from './createDevice.dto';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}
