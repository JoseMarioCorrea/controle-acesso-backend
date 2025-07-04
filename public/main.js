"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const dotenv = require("dotenv");
const path_1 = require("path");
require("./polyfill");
async function bootstrap() {
    dotenv.config({ path: (0, path_1.join)(__dirname, '..', '.env') });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads',
    });
    const publicPath = (0, path_1.join)(__dirname, '..', 'public');
    app.useStaticAssets(publicPath);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(/^(?!\/api).*$/, (_, res) => res.sendFile((0, path_1.join)(publicPath, 'index.html')));
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Server listening on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map