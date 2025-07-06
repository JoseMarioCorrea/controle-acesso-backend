// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
import './polyfill';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // 1) detecta pkg pra acertar baseDir
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  // Em EXE: dirname do executável.
  // Em dev: PASTA-DO-PROJETO (uma acima de src)
  const baseDir = runningInPkg
    ? dirname(process.execPath)
    : join(__dirname, '..');

  // 2) .env em baseDir
  dotenv.config({ path: join(baseDir, '.env') });

  // 3) pasta data + DB
  const dataDir = join(baseDir, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const dbFile   = join(dataDir, 'controle_acesso.sqlite');
  const seedFile = join(dataDir, 'seed.sqlite');
  if (!existsSync(dbFile) && existsSync(seedFile)) {
    copyFileSync(seedFile, dbFile);
  }

  // 4) Nest + Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  // 5) CORS
  expressApp.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    }),
  );

  // 6) uploads + SPA
  const uploadsDir = join(baseDir, 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  // serve os arquivos de upload
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  // serve o build React/Vue/... em public
  app.useStaticAssets(join(baseDir, 'public'));

  // 7) validação global
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // 8) init + SPA fallback
  await app.init();
  expressApp.get(/^\/(?!api\/).*/, (_, res) =>
    res.sendFile(join(baseDir, 'public', 'index.html')),
  );

  // 9) start server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server listening on http://localhost:${port}`);
}

bootstrap();
