import { Terminal } from './terminal.entity';
import { Repository } from 'typeorm';
import { CreateTerminalDto } from './dto/create-terminal.dto';
export declare class TerminalsService {
    private readonly repo;
    constructor(repo: Repository<Terminal>);
    create(dto: CreateTerminalDto): Promise<Terminal>;
    findAll(): Promise<Terminal[]>;
    findById(id: number): Promise<Terminal>;
}
