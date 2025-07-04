import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from '../departments/department.entity';
export declare class UsersService {
    private userRepo;
    private deptRepo;
    findAll(): void;
    constructor(userRepo: Repository<User>, deptRepo: Repository<Department>);
    create(dto: CreateUserDto): Promise<User>;
    findOne(id: number): Promise<User>;
    update(id: number, dto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<void>;
}
