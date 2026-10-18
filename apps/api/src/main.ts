import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureApp } from "./configure-app.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  configureApp(app);

  app.enableShutdownHooks();

  await app.listen(config.getOrThrow<number>("PORT"));

  Logger.log(`API listening at ${await app.getUrl()}/api`, "Bootstrap");
}
await bootstrap();
