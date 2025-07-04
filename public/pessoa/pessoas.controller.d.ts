import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Pessoa } from './pessoa.entity';
export declare class PessoasController {
    private readonly pessoasService;
    constructor(pessoasService: PessoasService);
    create(dto: CreatePessoaDto, foto?: Express.Multer.File): Promise<Pessoa>;
    findAll(): Promise<Pessoa[]>;
    findById(id: number): Promise<Pessoa>;
    update(id: number, dto: UpdatePessoaDto, foto?: Express.Multer.File): Promise<Pessoa>;
    remove(id: number, terminalId: number): Promise<void>;
}
