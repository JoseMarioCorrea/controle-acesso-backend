import { TerminalsService } from './terminals.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';
export declare class TerminalsController {
    private readonly terminals;
    constructor(terminals: TerminalsService);
    create(dto: CreateTerminalDto): Promise<import("./terminal.entity").Terminal>;
    findAll(): Promise<import("./terminal.entity").Terminal[]>;
    findOne(id: number): Promise<import("./terminal.entity").Terminal>;
}
