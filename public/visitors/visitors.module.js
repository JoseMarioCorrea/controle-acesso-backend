"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorModule = void 0;
const common_1 = require("@nestjs/common");
const visitors_controller_1 = require("./visitors.controller");
const visitors_service_1 = require("./visitors.service");
const typeorm_1 = require("@nestjs/typeorm");
const visitor_entity_1 = require("./visitor.entity");
const pessoa_entity_1 = require("../pessoa/pessoa.entity");
const idface_module_1 = require("../devices/idface.module");
const department_entity_1 = require("../departments/department.entity");
let VisitorModule = class VisitorModule {
};
exports.VisitorModule = VisitorModule;
exports.VisitorModule = VisitorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([visitor_entity_1.Visitante, pessoa_entity_1.Pessoa, department_entity_1.Department]),
            idface_module_1.IdfaceModule,
        ],
        controllers: [visitors_controller_1.VisitorsController],
        providers: [visitors_service_1.VisitorsService],
        exports: [visitors_service_1.VisitorsService],
    })
], VisitorModule);
//# sourceMappingURL=visitors.module.js.map