import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare class SchedulesService {
    private scheduleRepo;
    constructor(scheduleRepo: Repository<Schedule>);
    create(dto: CreateScheduleDto): Promise<Schedule>;
    findAll(): Promise<Schedule[]>;
    findOne(id: number): Promise<Schedule>;
    update(id: number, dto: UpdateScheduleDto): Promise<Schedule>;
    remove(id: number): Promise<void>;
}
