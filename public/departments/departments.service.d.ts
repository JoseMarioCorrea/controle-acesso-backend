import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User } from '../users/user.entity';
import { Visitante } from '../visitors/visitor.entity';
import { Grupo } from '../groups/grupo.entity';
export declare class DepartmentsService {
    private readonly deptRepo;
    private readonly userRepo;
    private readonly visitorRepo;
    private readonly grupoRepo;
    constructor(deptRepo: Repository<Department>, userRepo: Repository<User>, visitorRepo: Repository<Visitante>, grupoRepo: Repository<Grupo>);
    findAll(): Promise<Department[]>;
    findOne(id: number): Promise<Department>;
    update(id: number, dto: UpdateDepartmentDto): Promise<Department>;
    remove(id: number): Promise<void>;
    create(dto: CreateDepartmentDto): Promise<Department>;
    findGroupsByDepartment(departmentId: number): Promise<Grupo[]>;
}
