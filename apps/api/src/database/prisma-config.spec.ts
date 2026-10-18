import { fileURLToPath } from "node:url";

const configurationMocks = vi.hoisted(() => ({
  define: vi.fn((configuration: unknown) => configuration),
  loadEnvironment: vi.fn(),
}));

vi.mock("prisma/config", () => ({ defineConfig: configurationMocks.define }));

vi.mock("dotenv", () => ({ config: configurationMocks.loadEnvironment }));

const originalArguments = [...process.argv];
const developmentUrl = "postgresql://trading_dev:synthetic@127.0.0.1:5554/trading_dev";
const shadowUrl = "postgresql://trading_dev:synthetic@127.0.0.1:5554/trading_shadow";

function loadConfiguration(...arguments_: string[]) {
  process.argv = [process.execPath, "prisma", ...arguments_];
  return import("../../prisma7.config.js");
}

describe("Prisma CLI configuration", () => {
  beforeEach(() => {
    vi.resetModules();

    vi.clearAllMocks();

    vi.stubEnv("NODE_ENV", "test");

    vi.stubEnv("DATABASE_URL", undefined);

    vi.stubEnv("SHADOW_DATABASE_URL", undefined);
  });

  afterEach(() => {
    process.argv = [...originalArguments];

    vi.unstubAllEnvs();
  });

  it.each(["generate", "validate"])(
    "allows %s without credentials or environment-file loading",
    async (command) => {
      const { default: config } = await loadConfiguration(command, "--config", "prisma7.config.ts");

      expect(config).toEqual({
        schema: "prisma/schema.prisma",
        migrations: { path: "prisma/migrations" },
      });

      expect(configurationMocks.loadEnvironment).not.toHaveBeenCalled();

      expect(configurationMocks.define).toHaveBeenCalledOnce();
    },
  );

  it("does not expose inherited database URLs to generation", async () => {
    vi.stubEnv("DATABASE_URL", developmentUrl);

    vi.stubEnv("SHADOW_DATABASE_URL", shadowUrl);

    const { default: config } = await loadConfiguration("generate");

    expect(config).not.toHaveProperty("datasource");
  });

  it("loads only the API-local environment quietly outside test mode", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await loadConfiguration("generate");

    expect(configurationMocks.loadEnvironment).toHaveBeenCalledExactlyOnceWith({
      path: fileURLToPath(new URL("../../.env", import.meta.url)),
      quiet: true,
    });
  });

  it.each(["dev", "deploy", "status", "diff"])(
    "requires guarded targets for migrate %s even in test mode",
    async (subcommand) => {
      await expect(loadConfiguration("migrate", subcommand)).rejects.toMatchObject({
        name: "DatabaseConfigurationError",
        code: "DB_CONFIG_INVALID",
      });

      expect(configurationMocks.define).not.toHaveBeenCalled();

      expect(configurationMocks.loadEnvironment).not.toHaveBeenCalled();
    },
  );

  it.each(["dev", "deploy"])("supplies validated targets to migrate %s", async (subcommand) => {
    vi.stubEnv("DATABASE_URL", developmentUrl);

    vi.stubEnv("SHADOW_DATABASE_URL", shadowUrl);

    const { default: config } = await loadConfiguration("migrate", subcommand);

    expect(config).toEqual({
      schema: "prisma/schema.prisma",
      migrations: { path: "prisma/migrations" },
      datasource: { url: developmentUrl, shadowDatabaseUrl: shadowUrl },
    });
  });

  it.each([
    ["--url", developmentUrl],
    [`--url=${developmentUrl}`],
    ["--shadow-database-url", shadowUrl],
    [`--shadow-database-url=${shadowUrl}`],
    ["--schema", "prisma/schema.prisma"],
    ["--schema=prisma/schema.prisma"],
    ["-s", "prisma/schema.prisma"],
    ["--from-url", developmentUrl],
    ["--to-url", shadowUrl],
    ["--from-schema", "another.prisma"],
    ["--to-schema=another.prisma"],
    ["--"],
  ])("rejects CLI target overrides before Prisma configuration", async (...overrides) => {
    vi.stubEnv("DATABASE_URL", developmentUrl);

    vi.stubEnv("SHADOW_DATABASE_URL", shadowUrl);

    await expect(loadConfiguration("migrate", "dev", ...overrides)).rejects.toMatchObject({
      name: "DatabaseConfigurationError",
      code: "DB_CONFIG_INVALID",
    });

    expect(configurationMocks.define).not.toHaveBeenCalled();
  });

  it("rejects an unsafe target before defining Prisma configuration without exposing credentials", async () => {
    vi.stubEnv("DATABASE_URL", developmentUrl.replace("synthetic", "synthetic-secret-marker"));

    vi.stubEnv("SHADOW_DATABASE_URL", shadowUrl.replace("127.0.0.1", "remote.example"));

    await expect(loadConfiguration("migrate", "dev")).rejects.toMatchObject({
      name: "DatabaseConfigurationError",
      code: "DB_CONFIG_INVALID",
    });

    expect(configurationMocks.define).not.toHaveBeenCalled();
  });
});
