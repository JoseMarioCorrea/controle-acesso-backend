import { PartialType } from '@nestjs/mapped-types';
import { CreatePessoaDto } from './createPessoa.dto';
import { IsOptional, IsArray, ArrayUnique, IsInt } from 'class-validator';

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  grupos?: number[];
}
