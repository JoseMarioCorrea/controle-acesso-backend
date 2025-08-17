// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import * as dotenv from 'dotenv';
import './polyfill';
import { AppModule } from './app.module';
import { getUploadsRoot } from './common/uploads-path.util';

async function bootstrap() {
  /* 1) Base do runtime (dist/ ou pkg) */
  const runningInPkg = typeof (process as any).pkg !== 'undefined';
  const runtimeBaseDir = runningInPkg ? dirname(process.execPath) : join(__dirname, '..');

  /* 2) .env no diretório de runtime */
  dotenv.config({ path: join(runtimeBaseDir, '.env') });

  /* 3) Diretórios de dados (preferir %ProgramData%\MinhaApp no Windows) */
  const vendorName = process.env.APP_VENDOR || 'MinhaApp';
  const programData = process.platform === 'win32' ? process.env.PROGRAMDATA : undefined;
  const dataRoot = programData ? join(programData, vendorName) : runtimeBaseDir;
  const dataDir = join(dataRoot, 'data');

  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const dbFile = join(dataDir, 'controle_acesso.sqlite');
  const seedFile = join(dataDir, 'seed.sqlite'); // você empacota este arquivo no instalador
  if (!existsSync(dbFile) && existsSync(seedFile)) {
    copyFileSync(seedFile, dbFile);
  }

  /* 4) Cria Nest */
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /* 5) CORS (liberal em dev; ajuste origin em prod) */
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  /* 6) STATIC: uploads (/uploads/*) */
  const uploadsRoot = getUploadsRoot(); // ex.: raiz do projeto ou configurável por env
  const uploadsDir = join(uploadsRoot, 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  /* 7) STATIC: public (build do front) em / */
  const publicDir = join(runtimeBaseDir, 'public');
  if (existsSync(publicDir)) {
    app.useStaticAssets(publicDir);
  }

  /* 8) Validation global */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /* 9) Inicializa Nest */
  await app.init();

  /* 10) SPA fallback (apenas GET HTML; não intercepta uploads nem rotas de API comuns) */
  if (existsSync(publicDir)) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('*', (req: any, res: any, next: any) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/uploads')) return next();

      // evite “comer” endpoints de API conhecidos
      if (/^\/(api|auth|pessoas|visitors|departments|groups|idface)\b/i.test(req.path)) {
        return next();
      }

      // só faz fallback quando o cliente quer HTML
      const accept = req.headers['accept'] || '';
      if (!String(accept).includes('text/html')) return next();

      return res.sendFile(join(publicDir, 'index.html'));
    });
  }

  /* 11) Start + shutdown limpo (bom p/ agendador/serviço) */
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, process.env.HOST || '127.0.0.1');
  console.log(`🚀 Server listening on http://${process.env.HOST || '127.0.0.1'}:${port}`);

  const shutdown = async () => {
    try {
      await app.close();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
