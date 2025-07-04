import { Pessoa } from '../pessoa/pessoa.entity';
import { Department } from '../departments/department.entity';
export declare class Grupo {
    id: number;
    nome: string;
    descricao?: string;
    department: Department;
    department_id: number;
    pessoas: Pessoa[];
}
