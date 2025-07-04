"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdfaceModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const idface_service_1 = require("./idface.service");
const idface_controller_1 = require("./idface.controller");
const config_1 = require("@nestjs/config");
const terminal_entity_1 = require("../terminals/terminal.entity");
const terminals_module_1 = require("../terminals/terminals.module");
let IdfaceModule = class IdfaceModule {
};
exports.IdfaceModule = IdfaceModule;
exports.IdfaceModule = IdfaceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            terminals_module_1.TerminalsModule,
            terminal_entity_1.Terminal,
            axios_1.HttpModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    baseURL: cfg.get('IDFACE_BASE_URL'),
                    timeout: 5000,
                }),
            }),
        ],
        providers: [idface_service_1.IdfaceService],
        controllers: [idface_controller_1.IdfaceController],
        exports: [idface_service_1.IdfaceService],
    })
], IdfaceModule);
//# sourceMappingURL=idface.module.js.map