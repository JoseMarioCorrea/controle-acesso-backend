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
exports.Terminal = void 0;
const typeorm_1 = require("typeorm");
const department_entity_1 = require("../departments/department.entity");
let Terminal = class Terminal {
    id;
    name;
    host;
    port;
    model;
    departments;
};
exports.Terminal = Terminal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Terminal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Terminal.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Terminal.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 80 }),
    __metadata("design:type", Number)
], Terminal.prototype, "port", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Terminal.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => department_entity_1.Department, (dept) => dept.terminal),
    __metadata("design:type", Array)
], Terminal.prototype, "departments", void 0);
exports.Terminal = Terminal = __decorate([
    (0, typeorm_1.Entity)('terminais')
], Terminal);
//# sourceMappingURL=terminal.entity.js.map