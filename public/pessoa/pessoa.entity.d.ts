import { Grupo } from '../groups/grupo.entity';
export declare class Pessoa {
    id: number;
    nome: string;
    matricula: string;
    userIdIdface: number | null;
    rg: string;
    cpf: string;
    email: string;
    telefone: string;
    senha: string;
    observacoes: string;
    administrador: boolean;
    inativo: boolean;
    listaExcecao: boolean;
    fotoUrl: string;
    pendenteIdface: boolean;
    creditos: number;
    grupos: Grupo[];
    idfaceId: number;
    isVisitante: boolean;
    registro: any;
    terminalId: number;
}
