import { Repository } from 'typeorm';
import { License } from './license.entity';
import { CreateLicenseDto } from './dto/create-license.dto';
export declare class LicenseService {
    private readonly licenseRepo;
    constructor(licenseRepo: Repository<License>);
    create(dto: CreateLicenseDto): Promise<License>;
    findAll(): Promise<License[]>;
}
