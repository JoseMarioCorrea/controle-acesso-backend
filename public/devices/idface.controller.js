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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdfaceController = void 0;
const common_1 = require("@nestjs/common");
const idface_service_1 = require("./idface.service");
const platform_express_1 = require("@nestjs/platform-express");
let IdfaceController = class IdfaceController {
    idface;
    constructor(idface) {
        this.idface = idface;
    }
    login(terminalId, login, password) {
        return this.idface.login(terminalId, login, password);
    }
    logout(terminalId) {
        return this.idface.logout(terminalId);
    }
    valid(terminalId) {
        return this.idface.validateSession(terminalId);
    }
    reboot(terminalId) {
        return this.idface.reboot(terminalId);
    }
    factory(terminalId) {
        return this.idface.factoryReset(terminalId);
    }
    time(terminalId, dt) {
        return this.idface.setDateTime(terminalId, dt);
    }
    network(terminalId, cfg) {
        return this.idface.configureNetwork(terminalId, cfg);
    }
    async createUser(terminalId, name, registration, password, salt) {
        const userId = await this.idface.createUserOnDevice(terminalId, name, registration ?? '', password ?? '', salt ?? '');
        return { userId };
    }
    updateUser(terminalId, id, fields) {
        return this.idface.updateUserOnDevice(terminalId, id, fields);
    }
    deleteUser(terminalId, id) {
        return this.idface.deleteUserFromDevice(terminalId, id);
    }
    getUser(terminalId, id) {
        return this.idface.loadUserById(terminalId, id);
    }
    async confirmUserExists(terminalId, userId) {
        const exists = await this.idface.confirmUserExists(terminalId, userId);
        return { exists };
    }
    testUserImage(terminalId, file) {
        return this.idface.testUserImage(terminalId, file.buffer);
    }
    uploadFoto(terminalId, file, userId) {
        return this.idface.uploadUserPhoto(terminalId, file.buffer, userId);
    }
    assignUserToGroup(terminalId, userId, groupId) {
        return this.idface.assignUserToGroup(terminalId, userId, groupId);
    }
    getLastUserId(terminalId) {
        return this.idface
            .getLastUserId(terminalId)
            .then((id) => ({ lastUserId: id }));
    }
};
exports.IdfaceController = IdfaceController;
__decorate([
    (0, common_1.Post)('login/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('login')),
    __param(2, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('session/valid/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "valid", null);
__decorate([
    (0, common_1.Post)('reboot/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "reboot", null);
__decorate([
    (0, common_1.Post)('factory-reset/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "factory", null);
__decorate([
    (0, common_1.Post)('time/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('datetime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "time", null);
__decorate([
    (0, common_1.Post)('network/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "network", null);
__decorate([
    (0, common_1.Post)('users/:terminalId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('registration')),
    __param(3, (0, common_1.Body)('password')),
    __param(4, (0, common_1.Body)('salt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], IdfaceController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:terminalId/:id'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:terminalId/:id'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('users/:terminalId/:id'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "getUser", null);
__decorate([
    (0, common_1.Get)('users/:terminalId/confirm/:userId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], IdfaceController.prototype, "confirmUserExists", null);
__decorate([
    (0, common_1.Post)('user_test_image/:terminalId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "testUserImage", null);
__decorate([
    (0, common_1.Post)('foto/:terminalId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('user_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "uploadFoto", null);
__decorate([
    (0, common_1.Post)('users/:terminalId/:id/group/:groupId'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "assignUserToGroup", null);
__decorate([
    (0, common_1.Get)('users/:terminalId/last-id'),
    __param(0, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IdfaceController.prototype, "getLastUserId", null);
exports.IdfaceController = IdfaceController = __decorate([
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    (0, common_1.Controller)('idface'),
    __metadata("design:paramtypes", [idface_service_1.IdfaceService])
], IdfaceController);
//# sourceMappingURL=idface.controller.js.map