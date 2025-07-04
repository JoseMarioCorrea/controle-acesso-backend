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
exports.Grupo = void 0;
const typeorm_1 = require("typeorm");
const pessoa_entity_1 = require("../pessoa/pessoa.entity");
const department_entity_1 = require("../departments/department.entity");
let Grupo = class Grupo {
    id;
    nome;
    descricao;
    department;
    department_id;
    pessoas;
};
exports.Grupo = Grupo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Grupo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Grupo.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Grupo.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, (dept) => dept.grupos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], Grupo.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Grupo.prototype, "department_id", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => pessoa_entity_1.Pessoa, (pessoa) => pessoa.grupos),
    (0, typeorm_1.JoinTable)({
        name: 'pessoa_grupos',
        joinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'pessoa_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Grupo.prototype, "pessoas", void 0);
exports.Grupo = Grupo = __decorate([
    (0, typeorm_1.Entity)('grupos')
], Grupo);
//# sourceMappingURL=grupo.entity.js.map