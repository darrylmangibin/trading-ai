import "reflect-metadata";
import type { Server } from "node:http";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

const allocateDatabase = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("Liveness must not allocate database access");
  }),
);

vi.mock("../src/database/prisma.factory.js", () => ({
  createPrismaClient: allocateDatabase,
}));

const frontendOrigin = "http://localhost:6789";

describe.each([
  { configuration: "missing", databaseUrl: undefined },
  { configuration: "malformed", databaseUrl: "not-a-database-url" },
  {
    configuration: "unreachable",
    databaseUrl: "postgresql://trading_dev:synthetic@127.0.0.1:1/trading_dev",
  },
])("API (e2e), $configuration database configuration", ({ databaseUrl }) => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    allocateDatabase.mockClear();

    vi.stubEnv("DATABASE_URL", databaseUrl);

    vi.stubEnv("SHADOW_DATABASE_URL", undefined);

    vi.stubEnv("CORS_ORIGIN", frontendOrigin);

    vi.resetModules();

    const { AppModule } = await import("../src/app.module.js");
    const { configureApp } = await import("../src/configure-app.js");
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app);

    await app.init();
  });

  it("serves the health contract under the API prefix", () =>
    request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect("Content-Type", /json/)
      .expect({ status: "ok", service: "trading-api" }));

  it("does not expose the endpoint without the API prefix", () =>
    request(app.getHttpServer()).get("/health").expect(404));

  it("allows the configured frontend origin", () =>
    request(app.getHttpServer())
      .get("/api/health")
      .set("Origin", frontendOrigin)
      .expect(200)
      .expect("Access-Control-Allow-Origin", frontendOrigin));

  it("keeps module initialization and liveness free of database allocation", async () => {
    expect(allocateDatabase).not.toHaveBeenCalled();

    await request(app.getHttpServer()).get("/api/health").expect(200);

    expect(allocateDatabase).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await app?.close();

    expect(allocateDatabase).not.toHaveBeenCalled();

    vi.unstubAllEnvs();

    vi.resetModules();
  });
});
