import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare class SchedulesController {
    private readonly schedulesService;
    constructor(schedulesService: SchedulesService);
    create(dto: CreateScheduleDto): Promise<import("./schedule.entity").Schedule>;
    findAll(): Promise<import("./schedule.entity").Schedule[]>;
    findOne(id: number): Promise<import("./schedule.entity").Schedule>;
    update(id: number, dto: UpdateScheduleDto): Promise<import("./schedule.entity").Schedule>;
    remove(id: number): Promise<void>;
}
