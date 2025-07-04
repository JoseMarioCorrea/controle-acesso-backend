import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
export declare class HolidaysController {
    private readonly holidaysService;
    constructor(holidaysService: HolidaysService);
    create(dto: CreateHolidayDto): Promise<import("./holiday.entity").Holiday>;
    findAll(): Promise<import("./holiday.entity").Holiday[]>;
    findOne(id: number): Promise<import("./holiday.entity").Holiday>;
    update(id: number, dto: UpdateHolidayDto): Promise<import("./holiday.entity").Holiday>;
    remove(id: number): Promise<void>;
}
