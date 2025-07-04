import { Department } from '../departments/department.entity';
import { Grupo } from '../groups/grupo.entity';
export declare class User {
    id: number;
    nome: string;
    fotoUrl: string;
    cartaoRfid: string;
    biometriaFacialId: string;
    departamento: Department;
    isMaster: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
    grupos: Grupo[];
    released: boolean;
}
