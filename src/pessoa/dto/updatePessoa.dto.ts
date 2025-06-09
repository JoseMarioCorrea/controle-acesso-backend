import { PartialType } from '@nestjs/mapped-types';
import { CreatePessoaDto } from './createPessoa.dto';
import { IsOptional, IsArray, ArrayUnique, IsInt, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {
@IsOptional()
@IsArray()
@ArrayUnique()
@IsInt({ each: true })
@Type(() => Number) // <- converte strings em números
readonly grupos?: number[];

@IsOptional()
@IsInt()
@Type(() => Number)
userIdIdface?: number;
}
