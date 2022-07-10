import { createServer } from '@dite/server';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const server = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });
  const app = await createServer(server);
  app.enableRequestLog(true);
  await app.start();
}

export default bootstrap();
