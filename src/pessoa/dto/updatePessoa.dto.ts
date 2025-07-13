// src/pessoas/dto/updatePessoa.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePessoaDto } from './createPessoa.dto';
import {
  IsOptional,
  IsArray,
  ArrayUnique,
  ArrayNotEmpty,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty({ message: 'O array de grupos não pode estar vazio' })
  @IsInt({ each: true, message: 'Cada grupo deve ser um inteiro' })
  @Type(() => Number)
  readonly grupos?: number[];
}
