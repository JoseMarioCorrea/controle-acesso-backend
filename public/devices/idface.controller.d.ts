import { IdfaceService } from './idface.service';
export declare class IdfaceController {
    private readonly idface;
    constructor(idface: IdfaceService);
    login(terminalId: number, login: string, password: string): Promise<{
        session: string;
    }>;
    logout(terminalId: number): Promise<void>;
    valid(terminalId: number): Promise<{
        valid: any;
    }>;
    reboot(terminalId: number): Promise<void>;
    factory(terminalId: number): Promise<void>;
    time(terminalId: number, dt: string): Promise<void>;
    network(terminalId: number, cfg: any): Promise<void>;
    createUser(terminalId: number, name: string, registration?: string, password?: string, salt?: string): Promise<{
        userId: number;
    }>;
    updateUser(terminalId: number, id: number, fields: Record<string, any>): Promise<void>;
    deleteUser(terminalId: number, id: number): Promise<void>;
    getUser(terminalId: number, id: number): Promise<any>;
    confirmUserExists(terminalId: number, userId: number): Promise<{
        exists: boolean;
    }>;
    testUserImage(terminalId: number, file: Express.Multer.File): Promise<any>;
    uploadFoto(terminalId: number, file: Express.Multer.File, userId: number): Promise<any>;
    assignUserToGroup(terminalId: number, userId: number, groupId: number): Promise<void>;
    getLastUserId(terminalId: number): Promise<{
        lastUserId: number;
    }>;
}
