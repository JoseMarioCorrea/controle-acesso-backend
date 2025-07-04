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
exports.VisitorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const idface_service_1 = require("../devices/idface.service");
const typeorm_2 = require("typeorm");
const visitor_entity_1 = require("./visitor.entity");
let VisitorsService = class VisitorsService {
    visitorRepo;
    idface;
    constructor(visitorRepo, idface) {
        this.visitorRepo = visitorRepo;
        this.idface = idface;
    }
    async create(dto) {
        console.log('DTO recebido:', dto);
        const { ...rest } = dto;
        const visitante = this.visitorRepo.create(rest);
        const saved = await this.visitorRepo.save(visitante);
        console.log('Visitante salvo:', saved);
        if (!dto.terminalId)
            throw new Error('terminalId é obrigatório');
        if (Array.isArray(saved)) {
            throw new Error('Erro interno: múltiplos visitantes salvos, esperado apenas um.');
        }
        if (!dto.nome?.trim()) {
            throw new Error('Nome do visitante é obrigatório para o cadastro no iDFace');
        }
        await this.idface.login(dto.terminalId, 'admin', 'admin');
        await this.idface.createUserOnDevice(dto.terminalId, dto.nome, dto.matricula);
        return saved;
    }
    async findAll() {
        return this.visitorRepo.find();
    }
    async remove(id, terminalId) {
        const visitante = await this.visitorRepo.findOne({ where: { id } });
        if (!visitante)
            throw new common_1.NotFoundException('Visitante não encontrado');
        await this.visitorRepo.remove(visitante);
        await this.idface.login(terminalId, 'admin', 'admin');
        await this.idface.deleteUserFromDevice(terminalId, id);
    }
    async findById(id) {
        return this.visitorRepo.findOneOrFail({ where: { id } });
    }
    async update(id, dto) {
        const visitante = await this.visitorRepo.findOne({ where: { id } });
        if (!visitante) {
            throw new common_1.NotFoundException('Visitante não encontrado');
        }
        const { terminalId, shelfLifeDate, shelfLifeTime, ...rest } = dto;
        Object.assign(visitante, rest);
        const updated = await this.visitorRepo.save(visitante);
        if (terminalId) {
            await this.idface.login(terminalId, 'admin', 'admin');
            const endTimestamp = Math.floor(new Date(`${shelfLifeDate}T${shelfLifeTime}`).getTime() / 1000);
            await this.idface.modifyObjects(terminalId, {
                object: 'users',
                values: { begin_time: 0, end_time: endTimestamp },
                where: { users: { id: updated.id } },
            });
        }
        return updated;
    }
};
exports.VisitorsService = VisitorsService;
exports.VisitorsService = VisitorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(visitor_entity_1.Visitante)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        idface_service_1.IdfaceService])
], VisitorsService);
//# sourceMappingURL=visitors.service.js.map