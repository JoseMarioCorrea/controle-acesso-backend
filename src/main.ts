// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join, dirname } from 'path';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import cors = require('cors');
import './polyfill';

async function bootstrap() {
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  const baseDir = runningInPkg ? dirname(process.execPath) : __dirname;

  dotenv.config({ path: join(baseDir, '.env') });

  /* ---------- cria DB na 1ª execução ---------- */
  const dataDir = join(baseDir, 'data');
  const dbFile  = join(dataDir, 'controle_acesso.sqlite');
  const seed    = join(dataDir, 'seed.sqlite');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbFile) && existsSync(seed)) copyFileSync(seed, dbFile);

  /* ---------- instancia Nest ---------- */
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /* ---------- CORS global (vale p/ tudo) ---------- */
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    cors({
      origin: true,            // reflete a origem que chegou
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  /* ---------- estáticos ---------- */
  app.useStaticAssets(join(baseDir, 'uploads'), { prefix: '/uploads' });
  const publicPath = join(baseDir, 'public');
  app.useStaticAssets(publicPath);

  await app.init(); // registra todas as rotas Nest

  /* ---------- SPA fallback ---------- */
  expressApp.get(/^\/(?!api\/).*/, (_, res) =>
    res.sendFile(join(publicPath, 'index.html')),
  );

  /* ---------- validação ---------- */
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀  Server listening on http://localhost:${port}`);
}
bootstrap();
