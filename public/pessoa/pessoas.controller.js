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
exports.PessoasController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const pessoas_service_1 = require("./pessoas.service");
const createPessoa_dto_1 = require("./dto/createPessoa.dto");
const updatePessoa_dto_1 = require("./dto/updatePessoa.dto");
let PessoasController = class PessoasController {
    pessoasService;
    constructor(pessoasService) {
        this.pessoasService = pessoasService;
    }
    create(dto, foto) {
        return this.pessoasService.create(dto);
    }
    findAll() {
        return this.pessoasService.findAll();
    }
    findById(id) {
        return this.pessoasService.findById(id);
    }
    update(id, dto, foto) {
        return this.pessoasService.update(id, dto);
    }
    remove(id, terminalId) {
        return this.pessoasService.remove(id, terminalId);
    }
};
exports.PessoasController = PessoasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createPessoa_dto_1.CreatePessoaDto, Object]),
    __metadata("design:returntype", Promise)
], PessoasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PessoasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PessoasController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, updatePessoa_dto_1.UpdatePessoaDto, Object]),
    __metadata("design:returntype", Promise)
], PessoasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id/:terminalId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('terminalId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], PessoasController.prototype, "remove", null);
exports.PessoasController = PessoasController = __decorate([
    (0, common_1.Controller)('pessoas'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [pessoas_service_1.PessoasService])
], PessoasController);
//# sourceMappingURL=pessoas.controller.js.map