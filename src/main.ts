import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import './polyfill';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// Polyfill do crypto para TypeORM
async function bootstrap() {
  // Carrega .env (caso você use variáveis de ambiente)
  dotenv.config({ path: join(__dirname, '..', '.env') });
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  // Habilita CORS para todas as origens
  app.enableCors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true });

  // Validação global de DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server listening on http://localhost:${port}`);
}

bootstrap();
