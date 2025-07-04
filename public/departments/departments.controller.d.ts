import { Repository } from 'typeorm';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Grupo } from '../groups/grupo.entity';
import { Department } from './department.entity';
export declare class DepartmentsController {
    private readonly departmentsService;
    private readonly deptRepo;
    private readonly grupoRepo;
    constructor(departmentsService: DepartmentsService, deptRepo: Repository<Department>, grupoRepo: Repository<Grupo>);
    findAll(): Promise<Department[]>;
    findOne(id: number): Promise<Department>;
    update(id: number, dto: UpdateDepartmentDto): Promise<Department>;
    remove(id: number): Promise<void>;
    create(dto: CreateDepartmentDto): Promise<Department>;
    findGroupsByDepartment(departmentId: number): Promise<Grupo[]>;
}
