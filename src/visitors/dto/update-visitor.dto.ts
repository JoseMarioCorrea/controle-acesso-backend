// src/visitors/dto/update-visitor.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateVisitorDto } from '../dto/create-visitors.dto';

export class UpdateVisitorDto extends PartialType(CreateVisitorDto) {}
