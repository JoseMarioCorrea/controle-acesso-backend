import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateGrupoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
