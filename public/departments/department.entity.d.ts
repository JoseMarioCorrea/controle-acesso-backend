import { User } from '../users/user.entity';
import { Visitante } from '../visitors/visitor.entity';
import { Terminal } from '../terminals/terminal.entity';
import { Grupo } from '../groups/grupo.entity';
export declare class Department {
    id: number;
    nome: string;
    terminalId: number;
    terminal: Terminal;
    usuarios: User[];
    visitantes: Visitante[];
    grupos: Grupo[];
}
