// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
import './polyfill';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1) detecta pkg pra acertar baseDir
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  const baseDir = runningInPkg
    ? dirname(process.execPath)
    : join(__dirname, '..');

  // 2) lê .env em baseDir
  dotenv.config({ path: join(baseDir, '.env') });

  // 3) garante pasta data + copia seed se necessário
  const dataDir = join(baseDir, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const dbFile = join(dataDir, 'controle_acesso.sqlite');
  const seedFile = join(dataDir, 'seed.sqlite');
  if (!existsSync(dbFile) && existsSync(seedFile)) {
    copyFileSync(seedFile, dbFile);
  }

  // 4) cria Nest + pega instância Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  // 5) CORS
  expressApp.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  // 6) serve uploads (Multer output) sob /uploads
  const uploadsDir = join(baseDir, 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // 7) serve SPA build em public/
  app.useStaticAssets(join(baseDir, 'public'), { prefix: '/' });

  // 8) validação global sem transformação de tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,            // <-- isso faz string "1" virar number 1
      transformOptions: {
        enableImplicitConversion: true,
      }
    }),
  );

  // 9) init + SPA fallback (qualquer rota não-API)
  await app.init();
  expressApp.get(/^\/(?!api\/).*/, (_, res) => {
    res.sendFile(join(baseDir, 'public', 'index.html'));
  });

  // 10) start
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server listening on http://localhost:${port}`);
}

bootstrap();
