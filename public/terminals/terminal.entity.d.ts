import { Department } from '../departments/department.entity';
export declare class Terminal {
    id: number;
    name: string;
    host: string;
    port: number;
    model: string;
    departments: Department[];
}
