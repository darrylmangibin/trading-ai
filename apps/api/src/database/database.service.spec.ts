import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import type { PrismaClient } from "../generated/prisma/client.js";
import { DatabaseConfigurationError } from "./database.config.js";
import { DatabaseModule } from "./database.module.js";
import { DatabaseService } from "./database.service.js";
import { createPrismaClient } from "./prisma.factory.js";

vi.mock("./prisma.factory.js", () => ({ createPrismaClient: vi.fn() }));

const databaseUrl = "postgresql://trading_dev:synthetic@127.0.0.1:5554/trading_dev";
const factory = vi.mocked(createPrismaClient);

describe("lazy database access", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    factory.mockReset();

    vi.stubEnv("DATABASE_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not read configuration or allocate a client during construction", () => {
    const config = new ConfigService();
    const getConfiguration = vi.spyOn(config, "get");

    expect(new DatabaseService(config)).toBeInstanceOf(DatabaseService);

    expect(getConfiguration).not.toHaveBeenCalled();

    expect(factory).not.toHaveBeenCalled();
  });

  it("exports an injectable provider without database work during module initialization or closure", async () => {
    const module = await Test.createTestingModule({ imports: [DatabaseModule] }).compile();

    try {
      await module.init();

      expect(module.get(DatabaseService)).toBeInstanceOf(DatabaseService);

      expect(factory).not.toHaveBeenCalled();
    } finally {
      await module.close();
    }

    expect(factory).not.toHaveBeenCalled();
  });

  it("allocates once on first use and reuses the same client", () => {
    const config = new ConfigService({ DATABASE_URL: databaseUrl });
    const getConfiguration = vi.spyOn(config, "get");
    const client = { $disconnect: vi.fn().mockResolvedValue(undefined) } as unknown as PrismaClient;

    factory.mockReturnValue(client);

    const service = new DatabaseService(config);

    expect(factory).not.toHaveBeenCalled();

    expect(service.client).toBe(client);

    expect(service.client).toBe(client);

    expect(getConfiguration).toHaveBeenCalledExactlyOnceWith("DATABASE_URL");

    expect(factory).toHaveBeenCalledExactlyOnceWith({ connectionString: databaseUrl });
  });

  it.each([undefined, "not-a-database-url"])(
    "refuses missing or malformed configuration before allocation",
    (value) => {
      const service = new DatabaseService(new ConfigService({ DATABASE_URL: value }));

      expect(() => service.client).toThrow(DatabaseConfigurationError);

      expect(factory).not.toHaveBeenCalled();
    },
  );

  it("does not allocate a client merely to shut down", async () => {
    const config = new ConfigService();
    const getConfiguration = vi.spyOn(config, "get");
    const service = new DatabaseService(config);

    await service.onApplicationShutdown();

    expect(getConfiguration).not.toHaveBeenCalled();

    expect(factory).not.toHaveBeenCalled();
  });

  it("waits for the allocated client's disconnection during shutdown", async () => {
    const disconnected: { resolve?: () => void; promise?: Promise<void> } = {};

    disconnected.promise = new Promise<void>((resolve) => {
      disconnected.resolve = resolve;
    });
    const disconnect = vi.fn(() => disconnected.promise);
    const client = { $disconnect: disconnect } as unknown as PrismaClient;

    factory.mockReturnValue(client);
    const service = new DatabaseService(new ConfigService({ DATABASE_URL: databaseUrl }));

    expect(service.client).toBe(client);

    let completed = false;
    const shutdown = service.onApplicationShutdown().then(() => {
      completed = true;
    });

    await Promise.resolve();

    expect(disconnect).toHaveBeenCalledExactlyOnceWith();

    expect(completed).toBe(false);

    disconnected.resolve?.();

    await shutdown;

    expect(completed).toBe(true);
  });
});
