// src/terminals/dto/update-terminal.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTerminalDto } from './create-terminal.dto';

export class UpdateTerminalDto extends PartialType(CreateTerminalDto) {}
