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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("./department.entity");
const user_entity_1 = require("../users/user.entity");
const visitor_entity_1 = require("../visitors/visitor.entity");
const grupo_entity_1 = require("../groups/grupo.entity");
let DepartmentsService = class DepartmentsService {
    deptRepo;
    userRepo;
    visitorRepo;
    grupoRepo;
    constructor(deptRepo, userRepo, visitorRepo, grupoRepo) {
        this.deptRepo = deptRepo;
        this.userRepo = userRepo;
        this.visitorRepo = visitorRepo;
        this.grupoRepo = grupoRepo;
    }
    async findAll() {
        return this.deptRepo.find();
    }
    async findOne(id) {
        return this.deptRepo.findOneOrFail({ where: { id } });
    }
    async update(id, dto) {
        const dept = await this.deptRepo.findOne({ where: { id } });
        if (!dept)
            throw new common_1.NotFoundException('Departamento não encontrado');
        if (dto.userIds) {
            dept.usuarios = await this.userRepo.findByIds(dto.userIds);
        }
        if (dto.visitorIds) {
            dept.visitantes = await this.visitorRepo.findByIds(dto.visitorIds);
        }
        if (dto.nome)
            dept.nome = dto.nome;
        if (dto.terminalId)
            dept.terminalId = dto.terminalId;
        return this.deptRepo.save(dept);
    }
    async remove(id) {
        const dept = await this.deptRepo.findOne({ where: { id } });
        if (!dept)
            throw new common_1.NotFoundException('Departamento não encontrado');
        await this.deptRepo.remove(dept);
    }
    async create(dto) {
        const dept = this.deptRepo.create(dto);
        await this.deptRepo.save(dept);
        const grupoDto = {
            nome: `Grupo ${dept.nome}`,
            descricao: `Grupo padrão para o departamento ${dept.nome}`,
            department_id: dept.id,
        };
        const grupo = this.grupoRepo.create(grupoDto);
        await this.grupoRepo.save(grupo);
        return dept;
    }
    async findGroupsByDepartment(departmentId) {
        return this.grupoRepo.find({
            where: { department_id: departmentId },
        });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(visitor_entity_1.Visitante)),
    __param(3, (0, typeorm_1.InjectRepository)(grupo_entity_1.Grupo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map