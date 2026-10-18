import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { DatabaseConfiguration } from "./database.config.js";

export function createPrismaClient(configuration: DatabaseConfiguration): PrismaClient {
  const adapter = new PrismaPg({ connectionString: configuration.connectionString });

  return new PrismaClient({ adapter, log: [], errorFormat: "minimal" });
}
