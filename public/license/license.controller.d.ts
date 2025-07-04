import { LicenseService } from './license.service';
import { CreateLicenseDto } from './dto/create-license.dto';
export declare class LicenseController {
    private readonly licenseService;
    constructor(licenseService: LicenseService);
    signUp(dto: CreateLicenseDto): Promise<{
        message: string;
        data: import("./license.entity").License;
    }>;
}
