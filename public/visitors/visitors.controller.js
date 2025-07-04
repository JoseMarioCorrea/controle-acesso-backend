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
exports.VisitorsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const visitors_service_1 = require("./visitors.service");
const updatePessoa_dto_1 = require("../pessoa/dto/updatePessoa.dto");
const create_visitors_dto_1 = require("./dto/create-visitors.dto");
let VisitorsController = class VisitorsController {
    visitorsService;
    constructor(visitorsService) {
        this.visitorsService = visitorsService;
    }
    create(foto, dto) {
        return this.visitorsService.create(dto);
    }
    async findAllVisitors() {
        const all = await this.visitorsService.findAll();
        return all;
    }
    async findVisitorById(id) {
        const visitante = await this.visitorsService.findById(id);
        if (visitante == null) {
            throw new Error('Visitante não encontrado');
        }
        return visitante;
    }
    async updateVisitor(id, dto, foto) {
        const payload = {
            ...dto,
            isVisitante: true,
        };
        return this.visitorsService.update(id, payload);
    }
    remove(id, terminalId) {
        return this.visitorsService.remove(id, terminalId);
    }
};
exports.VisitorsController = VisitorsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_visitors_dto_1.CreateVisitorDto]),
    __metadata("design:returntype", void 0)
], VisitorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VisitorsController.prototype, "findAllVisitors", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VisitorsController.prototype, "findVisitorById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, updatePessoa_dto_1.UpdatePessoaDto, Object]),
    __metadata("design:returntype", Promise)
], VisitorsController.prototype, "updateVisitor", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], VisitorsController.prototype, "remove", null);
exports.VisitorsController = VisitorsController = __decorate([
    (0, common_1.Controller)('visitors'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [visitors_service_1.VisitorsService])
], VisitorsController);
//# sourceMappingURL=visitors.controller.js.map