import { Department } from '../departments/department.entity';
export declare class Visitante {
    id: number;
    nome: string;
    visitor_rg: string;
    visitor_cpf: string;
    rg: string;
    cpf: string;
    phone: string;
    email: string;
    observacoes: string;
    validade: string;
    visitorCompany: string;
    visitedCompanyName: string;
    shelfLifeDate: string;
    shelfLifeTime: string;
    matricula: string;
    terminalId: number;
    departmento: Department[];
}
