"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IdfaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdfaceService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const terminals_service_1 = require("../terminals/terminals.service");
let IdfaceService = IdfaceService_1 = class IdfaceService {
    http;
    terminalService;
    logger = new common_1.Logger(IdfaceService_1.name);
    sessions = {};
    constructor(http, terminalService) {
        this.http = http;
        this.terminalService = terminalService;
    }
    async getHttp(terminalId) {
        const terminal = await this.terminalService.findById(terminalId);
        const baseURL = `http://${terminal.host}:${terminal.port}`;
        return this.http.axiosRef.create({ baseURL });
    }
    async ensureSession(terminalId, login = 'admin', password = 'admin') {
        const http = await this.getHttp(terminalId);
        const resp = await http.post('/login.fcgi', { login, password });
        this.sessions[terminalId] = resp.data.session;
        this.logger.log(`✔ Login terminal ${terminalId}: session=${resp.data.session}`);
    }
    async login(terminalId, login, password) {
        await this.ensureSession(terminalId, login, password);
        return { session: this.sessions[terminalId] };
    }
    async logout(terminalId) {
        const http = await this.getHttp(terminalId);
        await http.post(`/logout?session=${this.sessions[terminalId]}`, {});
        this.logger.log(`✔ Logout terminal ${terminalId}`);
        delete this.sessions[terminalId];
    }
    async validateSession(terminalId) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const resp = await http.get(`/session/valid?session=${this.sessions[terminalId]}`);
        return { valid: resp.data.valid };
    }
    async liberarAcesso(terminalId, userId) {
        const client = this.getClientForTerminal(terminalId);
        const res = await client.post(`/liberar_acesso.cgi`, { user_id: userId });
        if (!res.data.success) {
            throw new Error(`Falha ao liberar acesso para usuário ${userId}`);
        }
    }
    async modifyObjects(terminalId, payload) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        await http.post(`/modify_objects.fcgi?session=${this.sessions[terminalId]}`, payload, { headers: { 'Content-Type': 'application/json' } });
    }
    async releaseUserOnDevice(terminalId, userId, name, defaultGroupId = 1) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const ruleUrl = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
        const ruleBody = {
            object: 'access_rules',
            values: [{ name: name, type: 1, priority: 0 }],
        };
        const ruleResp = await http.post(ruleUrl, ruleBody);
        const accessRuleId = ruleResp.data?.ids?.[0];
        if (!accessRuleId) {
            throw new Error('Erro ao criar regra de acesso');
        }
        const userAccessBody = {
            object: 'user_access_rules',
            values: [{ user_id: userId, access_rule_id: accessRuleId }],
        };
        const userAccessResp = await http.post(ruleUrl, userAccessBody);
        if (!userAccessResp.data?.ids?.length) {
            throw new Error('Erro ao associar usuário à regra de acesso');
        }
        const userGroupBody = {
            object: 'user_groups',
            values: [{ user_id: userId, group_id: defaultGroupId }],
        };
        const userGroupResp = await http.post(ruleUrl, userGroupBody);
        if (!userGroupResp.data?.ids?.length) {
            throw new Error('Erro ao associar usuário ao grupo padrão');
        }
        await http.post(`/load_objects.fcgi?session=${this.sessions[terminalId]}`, {
            object: 'user_access_rules',
        });
        await http.post(`/load_objects.fcgi?session=${this.sessions[terminalId]}`, {
            object: 'user_groups',
        });
        await http.post(`/load_objects.fcgi?session=${this.sessions[terminalId]}`, {
            object: 'access_rules',
        });
        this.logger.log(`✔ Usuário ${userId} liberado no terminal ${terminalId}`);
    }
    async reboot(terminalId) {
        const http = await this.getHttp(terminalId);
        await http.post(`/reboot?session=${this.sessions[terminalId]}`, {});
    }
    async factoryReset(terminalId) {
        const http = await this.getHttp(terminalId);
        await http.post(`/factory-reset?session=${this.sessions[terminalId]}`, {});
    }
    async setDateTime(terminalId, datetime) {
        const http = await this.getHttp(terminalId);
        await http.post(`/time?session=${this.sessions[terminalId]}`, { datetime });
    }
    async configureNetwork(terminalId, cfg) {
        const http = await this.getHttp(terminalId);
        await http.post(`/network?session=${this.sessions[terminalId]}`, cfg);
    }
    async createUserOnDevice(terminalId, name, registration = '', password = '', salt = '') {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'users',
            values: [{ name, registration, password, salt }],
        };
        const response = await http.post(url, body);
        const userId = response.data?.ids?.[0];
        if (!userId || typeof userId !== 'number') {
            throw new common_1.BadRequestException('Erro ao criar usuário no iDFace');
        }
        this.logger.log(`✔ Usuário criado: id=${userId} no terminal ${terminalId}`);
        await this.releaseUserOnDevice(terminalId, userId, name);
        return userId;
    }
    async confirmUserExists(terminalId, userId) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'users',
            where: { users: { id: userId } },
        };
        const response = await http.post(url, body);
        return response.data?.objects?.length > 0;
    }
    async loadUserById(terminalId, userId) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'users',
            where: { users: { id: userId } },
        };
        const response = await http.post(url, body);
        return response.data.objects?.[0] ?? null;
    }
    async uploadUserPhoto(terminalId, image, userId) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const timestamp = Math.floor(Date.now() / 1000);
        const url = `/user_set_image.fcgi?user_id=${userId}&timestamp=${timestamp}&match=0&session=${this.sessions[terminalId]}`;
        const response = await http.post(url, image, {
            headers: { 'Content-Type': 'application/octet-stream' },
        });
        if (!response.data?.success) {
            throw new common_1.BadRequestException({ message: 'Erro ao cadastrar foto' });
        }
        this.logger.log(`✔ Foto cadastrada para user_id=${userId} no terminal ${terminalId}`);
        return response.data;
    }
    async updateUserOnDevice(terminalId, id, fields) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/modify_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'users',
            values: fields,
            where: { users: { id } },
        };
        await http.post(url, body);
        this.logger.log(`✔ Atualizado user id=${id} no terminal ${terminalId}`);
    }
    async deleteUserFromDevice(terminalId, id) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/destroy_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'users',
            where: { users: { id } },
        };
        await http.post(url, body);
        this.logger.log(`✔ Deletado user id=${id} no terminal ${terminalId}`);
    }
    async assignUserToGroup(terminalId, userId, groupId) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/create_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'user_groups',
            values: [{ user_id: userId, group_id: groupId }],
        };
        const response = await http.post(url, body);
        if (!response.data?.ids?.length) {
            throw new common_1.BadRequestException('Falha ao vincular usuário ao grupo');
        }
        this.logger.log(`✔ user_id=${userId} associado ao group_id=${groupId} no terminal ${terminalId}`);
    }
    async testUserImage(terminalId, image) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const session = this.sessions[terminalId];
        const url = `/user_test_image.fcgi?session=${session}`;
        const response = await http.post(url, image, {
            headers: { 'Content-Type': 'application/octet-stream' },
        });
        return response.data;
    }
    async getLastUserId(terminalId) {
        await this.ensureSession(terminalId);
        const http = await this.getHttp(terminalId);
        const url = `/load_objects.fcgi?session=${this.sessions[terminalId]}`;
        const body = {
            object: 'users',
        };
        const response = await http.post(url, body);
        return response.data;
    }
};
exports.IdfaceService = IdfaceService;
exports.IdfaceService = IdfaceService = IdfaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        terminals_service_1.TerminalsService])
], IdfaceService);
//# sourceMappingURL=idface.service.js.map