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
exports.TerminalsController = void 0;
const common_1 = require("@nestjs/common");
const terminals_service_1 = require("./terminals.service");
const create_terminal_dto_1 = require("./dto/create-terminal.dto");
let TerminalsController = class TerminalsController {
    terminals;
    constructor(terminals) {
        this.terminals = terminals;
    }
    create(dto) {
        return this.terminals.create(dto);
    }
    findAll() {
        return this.terminals.findAll();
    }
    findOne(id) {
        return this.terminals.findById(id);
    }
};
exports.TerminalsController = TerminalsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_terminal_dto_1.CreateTerminalDto]),
    __metadata("design:returntype", void 0)
], TerminalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TerminalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TerminalsController.prototype, "findOne", null);
exports.TerminalsController = TerminalsController = __decorate([
    (0, common_1.Controller)('idface/terminals'),
    __metadata("design:paramtypes", [terminals_service_1.TerminalsService])
], TerminalsController);
//# sourceMappingURL=terminals.controller.js.map