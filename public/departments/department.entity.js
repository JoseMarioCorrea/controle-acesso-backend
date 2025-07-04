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
exports.Department = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const visitor_entity_1 = require("../visitors/visitor.entity");
const terminal_entity_1 = require("../terminals/terminal.entity");
const grupo_entity_1 = require("../groups/grupo.entity");
let Department = class Department {
    id;
    nome;
    terminalId;
    terminal;
    usuarios;
    visitantes;
    grupos;
};
exports.Department = Department;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Department.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Department.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Department.prototype, "terminalId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => terminal_entity_1.Terminal, (t) => t.departments, { eager: true }),
    __metadata("design:type", terminal_entity_1.Terminal)
], Department.prototype, "terminal", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, (u) => u.departamento, { cascade: true }),
    (0, typeorm_1.JoinTable)({ name: 'department_users' }),
    __metadata("design:type", Array)
], Department.prototype, "usuarios", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => visitor_entity_1.Visitante, (v) => v.departmento, { cascade: true }),
    (0, typeorm_1.JoinTable)({ name: 'department_visitors' }),
    __metadata("design:type", Array)
], Department.prototype, "visitantes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => grupo_entity_1.Grupo, (grupo) => grupo.department),
    __metadata("design:type", Array)
], Department.prototype, "grupos", void 0);
exports.Department = Department = __decorate([
    (0, typeorm_1.Entity)()
], Department);
//# sourceMappingURL=department.entity.js.map