import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsIoAdapter } from './common/adapters/cors-io.adapter';
import { parseCorsOrigins } from './config/cors';

async function bootstrap() {
  // En local, las variables vienen de .env; en Render, del panel.
  if (existsSync('.env')) process.loadEnvFile('.env');

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const origins = parseCorsOrigins(process.env.CORS_ORIGIN);
  logger.log(`Orígenes permitidos: ${origins.join(', ') || '(ninguno)'}`);

  app.enableCors({ origin: origins, methods: ['GET'] });
  app.useWebSocketAdapter(new CorsIoAdapter(app, origins));
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Descarte escuchando en el puerto ${port}`);
}
void bootstrap();
