import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  return await NestFactory.create(AppModule);
}

export default bootstrap;
