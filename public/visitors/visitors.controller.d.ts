import { VisitorsService } from './visitors.service';
import { UpdatePessoaDto } from '../pessoa/dto/updatePessoa.dto';
import { Visitante } from './visitor.entity';
import { CreateVisitorDto } from './dto/create-visitors.dto';
export declare class VisitorsController {
    private readonly visitorsService;
    constructor(visitorsService: VisitorsService);
    create(foto: Express.Multer.File, dto: CreateVisitorDto): Promise<Visitante>;
    findAllVisitors(): Promise<Visitante[]>;
    findVisitorById(id: number): Promise<Visitante>;
    updateVisitor(id: number, dto: UpdatePessoaDto, foto?: Express.Multer.File): Promise<Visitante>;
    remove(id: number, terminalId: number): Promise<void>;
}
