import { Repository } from 'typeorm';
import { Holiday } from './holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
export declare class HolidaysService {
    private holidayRepo;
    constructor(holidayRepo: Repository<Holiday>);
    create(dto: CreateHolidayDto): Promise<Holiday>;
    findAll(): Promise<Holiday[]>;
    findOne(id: number): Promise<Holiday>;
    update(id: number, dto: UpdateHolidayDto): Promise<Holiday>;
    remove(id: number): Promise<void>;
}
