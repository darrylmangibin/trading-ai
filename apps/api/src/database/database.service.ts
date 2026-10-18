import type { OnApplicationShutdown } from "@nestjs/common";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PrismaClient } from "../generated/prisma/client.js";
import { readDatabaseConfiguration } from "./database.config.js";
import { createPrismaClient } from "./prisma.factory.js";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private allocatedClient?: PrismaClient;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  get client(): PrismaClient {
    if (!this.allocatedClient) {
      const configuration = readDatabaseConfiguration(this.config.get<unknown>("DATABASE_URL"));

      // Synchronous allocation publishes the singleton before any query can yield.
      this.allocatedClient = createPrismaClient(configuration);
    }

    return this.allocatedClient;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.allocatedClient?.$disconnect();
  }
}
