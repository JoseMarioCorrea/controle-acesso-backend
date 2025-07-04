import { HttpService } from '@nestjs/axios';
import { TerminalsService } from 'src/terminals/terminals.service';
export declare class IdfaceService {
    private readonly http;
    private readonly terminalService;
    [x: string]: any;
    private readonly logger;
    private sessions;
    constructor(http: HttpService, terminalService: TerminalsService);
    private getHttp;
    private ensureSession;
    login(terminalId: number, login: string, password: string): Promise<{
        session: string;
    }>;
    logout(terminalId: number): Promise<void>;
    validateSession(terminalId: number): Promise<{
        valid: any;
    }>;
    liberarAcesso(terminalId: number, userId: string): Promise<void>;
    modifyObjects(terminalId: number, payload: {
        object: string;
        values: Record<string, any>;
        where: Record<string, any>;
    }): Promise<void>;
    releaseUserOnDevice(terminalId: number, userId: number, name: string, defaultGroupId?: number): Promise<void>;
    reboot(terminalId: number): Promise<void>;
    factoryReset(terminalId: number): Promise<void>;
    setDateTime(terminalId: number, datetime: string): Promise<void>;
    configureNetwork(terminalId: number, cfg: any): Promise<void>;
    createUserOnDevice(terminalId: number, name: string, registration?: string, password?: string, salt?: string): Promise<number>;
    confirmUserExists(terminalId: number, userId: number): Promise<boolean>;
    loadUserById(terminalId: number, userId: number): Promise<any>;
    uploadUserPhoto(terminalId: number, image: Buffer, userId: number): Promise<any>;
    updateUserOnDevice(terminalId: number, id: number, fields: Record<string, any>): Promise<void>;
    deleteUserFromDevice(terminalId: number, id: number): Promise<void>;
    assignUserToGroup(terminalId: number, userId: number, groupId: number): Promise<void>;
    testUserImage(terminalId: number, image: Buffer): Promise<any>;
    getLastUserId(terminalId: number): Promise<number>;
}
