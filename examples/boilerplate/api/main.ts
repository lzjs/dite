import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const server = await NestFactory.create(AppModule, {});
  // const app = await createServer({ pwd: process.cwd() });
  // app.enableRequestLog(true);
  // return app;
  return server;
}

export default bootstrap;
