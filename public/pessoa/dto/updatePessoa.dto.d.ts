import { CreatePessoaDto } from './createPessoa.dto';
declare const UpdatePessoaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePessoaDto>>;
export declare class UpdatePessoaDto extends UpdatePessoaDto_base {
    readonly grupos?: number[];
    readonly userIdIdface?: number;
    readonly terminalId?: any;
}
export {};
