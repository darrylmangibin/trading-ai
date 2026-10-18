import "reflect-metadata";
import type { Server } from "node:http";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/configure-app.js";

describe("API (e2e)", () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
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

  it("allows the configured frontend origin", () => {
    const origin = app.get(ConfigService).getOrThrow<string>("CORS_ORIGIN");

    return request(app.getHttpServer())
      .get("/api/health")
      .set("Origin", origin)
      .expect(200)
      .expect("Access-Control-Allow-Origin", origin);
  });

  afterAll(async () => {
    await app.close();
  });
});
