import { createDiteApp } from '@dite/nest';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function main() {
  const app = await NestFactory.create(AppModule);
  const server = createDiteApp(app);
  await server.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
