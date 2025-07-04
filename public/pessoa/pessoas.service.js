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
var PessoasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PessoasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pessoa_entity_1 = require("./pessoa.entity");
const grupo_entity_1 = require("../groups/grupo.entity");
const idface_service_1 = require("../devices/idface.service");
let PessoasService = PessoasService_1 = class PessoasService {
    repo;
    grupoRepo;
    idfaceService;
    idface;
    logger = new common_1.Logger(PessoasService_1.name);
    getClientForTerminal;
    constructor(repo, grupoRepo, idfaceService, idface) {
        this.repo = repo;
        this.grupoRepo = grupoRepo;
        this.idfaceService = idfaceService;
        this.idface = idface;
    }
    async create(dto) {
        const { grupos, ...rest } = dto;
        const pessoa = this.repo.create(rest);
        let idfaceId;
        if (grupos?.length) {
            pessoa.grupos = await this.grupoRepo.findByIds(grupos);
        }
        const saved = await this.repo.save(pessoa);
        this.logger.log(`Pessoa criada no BD com id ${saved.id}`);
        try {
            const terminalId = dto.terminalId;
            const nome = saved.nome;
            const registro = saved.registro;
            const saveId = saved.userIdIdface;
            if (typeof terminalId !== 'number') {
                throw new common_1.BadRequestException('terminalId é obrigatório para criar usuário no iDFace');
            }
            if (!saved.inativo) {
                idfaceId = await this.idface.createUserOnDevice(terminalId, nome, registro);
                this.logger.log(`Pessoa ${saved.id} liberada no iDFace`);
            }
            else {
                this.logger.warn(`Pessoa ${saved.id} está inativa e não será liberada no iDFace`);
            }
            this.logger.log(`Pessoa ${saved.id} criada no iDFace`);
        }
        catch (err) {
            this.logger.error(`Falha ao criar Pessoa ${saved.id} no iDFace`, err);
        }
        return idfaceId;
    }
    async findAll() {
        return this.repo.find({ relations: ['grupos'] });
    }
    async findById(id) {
        return this.repo.findOneOrFail({ where: { id }, relations: ['grupos'] });
    }
    async update(id, dto) {
        const { grupos, ...rest } = dto;
        const pessoa = await this.repo.preload({ id, ...rest });
        if (!pessoa)
            throw new common_1.NotFoundException('Pessoa não encontrada');
        if (grupos) {
            pessoa.grupos = await this.grupoRepo.findByIds(grupos);
        }
        const saved = await this.repo.save(pessoa);
        this.logger.log(`Pessoa ${id} atualizada no BD`);
        try {
            const terminalId = dto.terminalId;
            const id = saved.id;
            const registro = saved.registro;
            await this.idface.updateUserOnDevice(terminalId, id, registro);
            this.logger.log(`Pessoa ${id} reconfigurada no iDFace`);
        }
        catch (err) {
            this.logger.error(`Falha ao reconfigurar Pessoa ${id} no iDFace`, err);
        }
        return saved;
    }
    async liberarAcesso(terminalId, userId) {
        const client = this.getClientForTerminal(terminalId);
        const res = await client.post(`/liberar_acesso.cgi`, { user_id: userId });
        if (!res.data.success) {
            throw new Error(`Falha ao liberar acesso para usuário ${userId}`);
        }
    }
    async remove(id, terminalId) {
        const pessoa = await this.repo.findOne({ where: { id } });
        if (!pessoa) {
            this.logger.warn(`Pessoa ${id} não encontrada no banco de dados`);
            return;
        }
        const response = await this.repo.remove(pessoa);
        this.logger.log(`✔ Pessoa ${id} removida do banco de dados`);
        if (response) {
            try {
                await this.idface.deleteUserFromDevice(terminalId, id);
                this.logger.log(`✔ Pessoa ${id} removida do terminal iDFace ${terminalId}`);
            }
            catch (err) {
                this.logger.error(`❌ Falha ao remover pessoa ${id} do iDFace`, err);
            }
        }
        else {
            try {
                await this.idface.deleteUserFromDevice(terminalId, id);
                this.logger.log(`✔ Pessoa ${id} removida do terminal iDFace ${terminalId}`);
            }
            catch (err) {
                this.logger.error(`❌ Falha ao remover pessoa ${id} do iDFace`, err);
            }
        }
    }
};
exports.PessoasService = PessoasService;
exports.PessoasService = PessoasService = PessoasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pessoa_entity_1.Pessoa)),
    __param(1, (0, typeorm_1.InjectRepository)(grupo_entity_1.Grupo)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => idface_service_1.IdfaceService))),
    __metadata("design:paramtypes", [Function, Function, idface_service_1.IdfaceService,
        idface_service_1.IdfaceService])
], PessoasService);
//# sourceMappingURL=pessoas.service.js.map