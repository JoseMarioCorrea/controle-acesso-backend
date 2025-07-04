"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const departments_module_1 = require("./departments/departments.module");
const schedules_module_1 = require("./schedules/schedules.module");
const holidays_module_1 = require("./holidays/holidays.module");
const alarms_module_1 = require("./alarms/alarms.module");
const reports_module_1 = require("./reports/reports.module");
const system_module_1 = require("./system/system.module");
const network_module_1 = require("./network/network.module");
const auth_module_1 = require("./auth/auth.module");
const typeorm_1 = require("@nestjs/typeorm");
const idface_module_1 = require("./devices/idface.module");
const dotenv = require("dotenv");
const pessoa_module_1 = require("./pessoa/pessoa.module");
const license_module_1 = require("./license/license.module");
const terminals_module_1 = require("./terminals/terminals.module");
const visitors_module_1 = require("./visitors/visitors.module");
const config_1 = require("@nestjs/config");
require("./polyfill");
dotenv.config();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                ignoreEnvFile: true,
                load: [
                    () => ({
                        DB_TYPE: 'sqlite',
                        DB_DATABASE: './data/controle_acesso.sqlite',
                        IDFACE_BASE_URL: 'http://192.168.18.55',
                    }),
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'sqlite',
                    database: cfg.get('DB_DATABASE'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: true,
                    autoLoadEntities: true,
                    logging: false,
                }),
            }),
            users_module_1.UsersModule,
            departments_module_1.DepartmentsModule,
            schedules_module_1.SchedulesModule,
            holidays_module_1.HolidaysModule,
            alarms_module_1.AlarmsModule,
            reports_module_1.ReportsModule,
            system_module_1.SystemModule,
            network_module_1.NetworkModule,
            auth_module_1.AuthModule,
            idface_module_1.IdfaceModule,
            pessoa_module_1.PessoaModule,
            license_module_1.LicenseModule,
            terminals_module_1.TerminalsModule,
            visitors_module_1.VisitorModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map