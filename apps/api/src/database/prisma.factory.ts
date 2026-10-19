import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { DatabaseConfiguration } from "./database.config.js";

export function createPrismaClient(
  configuration: DatabaseConfiguration,
  timeoutMillis?: number,
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: configuration.connectionString,
    ...(timeoutMillis === undefined
      ? {}
      : {
          connectionTimeoutMillis: timeoutMillis,
          query_timeout: timeoutMillis,
          statement_timeout: timeoutMillis,
        }),
  });

  return new PrismaClient({ adapter, log: [], errorFormat: "minimal" });
}
