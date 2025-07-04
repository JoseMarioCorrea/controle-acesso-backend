import type { Repository } from 'typeorm';
import { Pessoa } from './pessoa.entity';
import { CreatePessoaDto } from './dto/createPessoa.dto';
import { UpdatePessoaDto } from './dto/updatePessoa.dto';
import { Grupo } from '../groups/grupo.entity';
import { IdfaceService } from '../devices/idface.service';
export declare class PessoasService {
    private readonly repo;
    private readonly grupoRepo;
    private readonly idfaceService;
    private readonly idface;
    private readonly logger;
    getClientForTerminal: any;
    constructor(repo: Repository<Pessoa>, grupoRepo: Repository<Grupo>, idfaceService: IdfaceService, idface: IdfaceService);
    create(dto: CreatePessoaDto): Promise<Pessoa>;
    findAll(): Promise<Pessoa[]>;
    findById(id: number): Promise<Pessoa>;
    update(id: number, dto: UpdatePessoaDto): Promise<Pessoa>;
    liberarAcesso(terminalId: number, userId: number): Promise<void>;
    remove(id: number, terminalId: number): Promise<void>;
}
