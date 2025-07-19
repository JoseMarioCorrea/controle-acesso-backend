// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, dirname } from 'path';
import {
  existsSync,
  mkdirSync,
  copyFileSync,
} from 'fs';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
import './polyfill';
import { AppModule } from './app.module';

/* ------------------------------------------------------------------
 * Imports util de uploads: raiz física onde salvaremos arquivos
 * (/uploads/* será servido a partir daqui).
 *  - Se ainda não criou o arquivo, veja o snippet após este bloco.
 * -----------------------------------------------------------------*/
import { getUploadsRoot } from './common/uploads-path.util';

async function bootstrap() {
  /* --------------------------------------------------------------
   * 1) Diretório base de RUNTIME (dist ou pkg)
   *    __dirname => .../dist/src   → subimos 1 nível = dist/
   *    Em build pkg usamos dirname(process.execPath).
   *    Esse base é usado para: .env, data/, public/ (build front)
   * -------------------------------------------------------------*/
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  const runtimeBaseDir = runningInPkg
    ? dirname(process.execPath)
    : join(__dirname, '..');

  /* --------------------------------------------------------------
   * 2) Carrega variáveis de ambiente do runtimeBaseDir/.env
   * -------------------------------------------------------------*/
  dotenv.config({ path: join(runtimeBaseDir, '.env') });

  /* --------------------------------------------------------------
   * 3) Banco SQLite & seed
   * -------------------------------------------------------------*/
  const dataDir = join(runtimeBaseDir, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const dbFile   = join(dataDir, 'controle_acesso.sqlite');
  const seedFile = join(dataDir, 'seed.sqlite');
  if (!existsSync(dbFile) && existsSync(seedFile)) {
    copyFileSync(seedFile, dbFile);
  }

  /* --------------------------------------------------------------
   * 4) Cria Nest
   * -------------------------------------------------------------*/
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  /* --------------------------------------------------------------
   * 5) CORS (liberal em dev)
   * -------------------------------------------------------------*/
  expressApp.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  /* --------------------------------------------------------------
   * 6) STATIC: uploads
   *     - getUploadsRoot() => raiz do projeto (process.cwd()) ou env
   *     - Garantimos pasta <uploadsRoot>/uploads
   *     - Servimos em /uploads/*
   * -------------------------------------------------------------*/
  const uploadsRoot = getUploadsRoot(); // ex.: /caminho/do/projeto
  const uploadsDir  = join(uploadsRoot, 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  /* --------------------------------------------------------------
   * 7) STATIC: public SPA (build do front)
   *    Servido em /  (não use prefix:'/'; express entende raiz)
   * -------------------------------------------------------------*/
  const publicDir = join(runtimeBaseDir, 'public');
  if (existsSync(publicDir)) {
    app.useStaticAssets(publicDir);
  }

  /* --------------------------------------------------------------
   * 8) ValidationPipe global
   *    - whitelist/remove campos desconhecidos
   *    - forbidNonWhitelisted -> 400 se vier lixo
   *    - transform + enableImplicitConversion -> converte string->number
   * -------------------------------------------------------------*/
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /* --------------------------------------------------------------
   * 9) Inicializa Nest
   * -------------------------------------------------------------*/
  await app.init();

  /* --------------------------------------------------------------
   * 10) SPA fallback:
   *     - Após init, registramos rota catch‑all para GETs que NÃO
   *       comecem por /uploads e NÃO correspondam a uma rota existente.
   *     - Se não quiser fallback (ex: front rodando via vite), pode comentar.
   * -------------------------------------------------------------*/
  if (existsSync(publicDir)) {
    expressApp.get('*', (req, res, next) => {
      // evita capturar assets de uploads
      if (req.path.startsWith('/uploads')) return next();
      // se API de fato existiu e respondeu 404 via Nest,
      // podemos ainda assim servir index.html para SPA.
      res.sendFile(join(publicDir, 'index.html'));
    });
  }

  /* --------------------------------------------------------------
   * 11) Start
   * -------------------------------------------------------------*/
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`🚀 Server listening on http://localhost:${port}`);
}

bootstrap();
