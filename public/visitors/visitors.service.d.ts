import { IdfaceService } from 'src/devices/idface.service';
import { Repository } from 'typeorm';
import { Visitante } from './visitor.entity';
import { CreateVisitorDto } from './dto/create-visitors.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
export declare class VisitorsService {
    private readonly visitorRepo;
    private readonly idface;
    constructor(visitorRepo: Repository<Visitante>, idface: IdfaceService);
    create(dto: CreateVisitorDto): Promise<Visitante>;
    findAll(): Promise<Visitante[]>;
    remove(id: number, terminalId: number): Promise<void>;
    findById(id: number): Promise<Visitante>;
    update(id: number, dto: UpdateVisitorDto): Promise<Visitante>;
}
