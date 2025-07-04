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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePessoaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const createPessoa_dto_1 = require("./createPessoa.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdatePessoaDto extends (0, mapped_types_1.PartialType)(createPessoa_dto_1.CreatePessoaDto) {
    grupos;
    userIdIdface;
    terminalId;
}
exports.UpdatePessoaDto = UpdatePessoaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'O array de grupos não pode estar vazio' }),
    (0, class_validator_1.IsInt)({ each: true, message: 'Cada grupo deve ser um inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Array)
], UpdatePessoaDto.prototype, "grupos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'userIdIdface deve ser um número inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePessoaDto.prototype, "userIdIdface", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'terminalId deve ser um número inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Object)
], UpdatePessoaDto.prototype, "terminalId", void 0);
//# sourceMappingURL=updatePessoa.dto.js.map