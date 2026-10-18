import {
  DatabaseConfigurationError,
  readDatabaseConfiguration,
  readMigrationConfiguration,
} from "./database.config.js";

const developmentUrl = "postgresql://trading_dev:synthetic@127.0.0.1:5554/trading_dev";
const shadowUrl = "postgresql://trading_dev:synthetic@127.0.0.1:5554/trading_shadow";

describe("database configuration", () => {
  it.each([
    "postgresql://trading_dev:synthetic@127.0.0.1:5554/trading_dev",
    "postgres://trading_dev:synthetic@localhost:5554/trading_dev",
    "postgresql://trading_dev:synthetic%40%3A%2Fpassword@db-dev:5432/trading_dev",
  ])("preserves a valid explicit PostgreSQL connection URL", (value) => {
    expect(readDatabaseConfiguration(value)).toEqual({ connectionString: value });
  });

  it.each([
    { reason: "missing value", value: undefined },
    { reason: "null value", value: null },
    { reason: "non-string value", value: 5554 },
    { reason: "empty value", value: "" },
    { reason: "non-URL value", value: "not-a-database-url" },
    { reason: "wrong scheme", value: "https://user:synthetic@localhost:5554/trading_dev" },
    { reason: "missing login", value: "postgresql://:synthetic@localhost:5554/trading_dev" },
    { reason: "missing password", value: "postgresql://trading_dev@localhost:5554/trading_dev" },
    { reason: "missing database", value: "postgresql://trading_dev:synthetic@localhost:5554/" },
    { reason: "missing port", value: "postgresql://trading_dev:synthetic@localhost/trading_dev" },
    { reason: "zero port", value: "postgresql://trading_dev:synthetic@localhost:0/trading_dev" },
    {
      reason: "out-of-range port",
      value: "postgresql://trading_dev:synthetic@localhost:65536/trading_dev",
    },
    {
      reason: "multiple hosts",
      value: "postgresql://trading_dev:synthetic@localhost,remote:5554/trading_dev",
    },
    { reason: "multiple path segments", value: `${developmentUrl}/extra` },
    { reason: "query override", value: `${developmentUrl}?host=remote` },
    { reason: "empty query", value: `${developmentUrl}?` },
    { reason: "fragment override", value: `${developmentUrl}#remote` },
    { reason: "empty fragment", value: `${developmentUrl}#` },
    { reason: "whitespace", value: ` ${developmentUrl}` },
    { reason: "backslash", value: `${developmentUrl}\\` },
    {
      reason: "malformed username encoding",
      value: developmentUrl.replace("trading_dev:", "%ZZ:"),
    },
    {
      reason: "malformed password encoding",
      value: developmentUrl.replace(":synthetic@", ":%ZZ@"),
    },
    { reason: "malformed database encoding", value: `${developmentUrl}%ZZ` },
    {
      reason: "encoded control character",
      value: developmentUrl.replace(":synthetic@", ":synthetic%0A@"),
    },
  ])("rejects $reason with a typed configuration error", ({ value }) => {
    expect(() => readDatabaseConfiguration(value)).toThrow(DatabaseConfigurationError);
  });

  it("omits the supplied credentials and parsing cause from errors", () => {
    try {
      readDatabaseConfiguration(
        "postgresql://trading_dev:synthetic-secret-marker@localhost:5554/trading_dev?host=remote",
      );
      throw new Error("Expected a configuration failure");
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseConfigurationError);

      expect(error).toMatchObject({
        name: "DatabaseConfigurationError",
        code: "DB_CONFIG_INVALID",
      });

      expect(String(error)).not.toContain("synthetic-secret-marker");

      expect(JSON.stringify(error)).not.toContain("synthetic-secret-marker");

      expect(error).not.toHaveProperty("cause");
    }
  });
});

describe("migration configuration", () => {
  it.each([
    { development: developmentUrl, shadow: shadowUrl },
    { development: developmentUrl.replace("127.0.0.1", "localhost"), shadow: shadowUrl },
    {
      development: developmentUrl.replace("127.0.0.1:5554", "db-dev:5432"),
      shadow: shadowUrl.replace("127.0.0.1:5554", "db-dev:5432"),
    },
    {
      development: developmentUrl.replace("synthetic", "synthetic%40password"),
      shadow: shadowUrl.replace("synthetic", "synthetic%40password"),
    },
    {
      development: developmentUrl.replace("trading_dev:", "trading%5Fdev:"),
      shadow: shadowUrl.replace("/trading_shadow", "/trading%5Fshadow"),
    },
  ])(
    "accepts distinct development and shadow databases on one approved endpoint",
    ({ development, shadow }) => {
      expect(readMigrationConfiguration(development, shadow)).toEqual({
        url: development,
        shadowDatabaseUrl: shadow,
      });
    },
  );

  it.each([
    { reason: "missing development URL", development: undefined, shadow: shadowUrl },
    { reason: "missing shadow URL", development: developmentUrl, shadow: undefined },
    { reason: "same database", development: developmentUrl, shadow: developmentUrl },
    {
      reason: "loopback-alias same database",
      development: developmentUrl,
      shadow: developmentUrl.replace("127.0.0.1", "localhost"),
    },
    {
      reason: "encoded same database",
      development: developmentUrl,
      shadow: developmentUrl.replace("/trading_dev", "/trading%5Fdev"),
    },
    {
      reason: "test development port",
      development: developmentUrl.replace(":5554", ":5556"),
      shadow: shadowUrl,
    },
    {
      reason: "test shadow port",
      development: developmentUrl,
      shadow: shadowUrl.replace(":5554", ":5556"),
    },
    {
      reason: "test development database",
      development: developmentUrl.replace("/trading_dev", "/trading_test"),
      shadow: shadowUrl,
    },
    {
      reason: "test shadow database",
      development: developmentUrl,
      shadow: shadowUrl.replace("/trading_shadow", "/trading_test"),
    },
    {
      reason: "remote development host",
      development: developmentUrl.replace("127.0.0.1", "shared.example"),
      shadow: shadowUrl,
    },
    {
      reason: "remote shadow host",
      development: developmentUrl,
      shadow: shadowUrl.replace("127.0.0.1", "shared.example"),
    },
    {
      reason: "wrong container port",
      development: developmentUrl.replace("127.0.0.1:5554", "db-dev:5554"),
      shadow: shadowUrl,
    },
    {
      reason: "different endpoints",
      development: developmentUrl,
      shadow: shadowUrl.replace("127.0.0.1:5554", "db-dev:5432"),
    },
    {
      reason: "administrator development login",
      development: developmentUrl.replace("trading_dev:", "supabase_admin:"),
      shadow: shadowUrl,
    },
    {
      reason: "administrator shadow login",
      development: developmentUrl,
      shadow: shadowUrl.replace("trading_dev:", "supabase_admin:"),
    },
    {
      reason: "different passwords",
      development: developmentUrl,
      shadow: shadowUrl.replace(":synthetic@", ":synthetic-other@"),
    },
    {
      reason: "development query override",
      development: `${developmentUrl}?schema=public`,
      shadow: shadowUrl,
    },
    {
      reason: "shadow query override",
      development: developmentUrl,
      shadow: `${shadowUrl}?host=remote`,
    },
    { reason: "development fragment", development: `${developmentUrl}#remote`, shadow: shadowUrl },
    { reason: "shadow malformed encoding", development: developmentUrl, shadow: `${shadowUrl}%ZZ` },
  ])("rejects $reason before returning migration targets", ({ development, shadow }) => {
    expect(() => readMigrationConfiguration(development, shadow)).toThrow(
      DatabaseConfigurationError,
    );
  });

  it("redacts unsafe migration inputs", () => {
    try {
      readMigrationConfiguration(
        developmentUrl.replace("synthetic", "synthetic-secret-marker"),
        shadowUrl.replace("127.0.0.1", "remote.example"),
      );
      throw new Error("Expected a migration configuration failure");
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseConfigurationError);

      expect(String(error)).not.toContain("synthetic-secret-marker");

      expect(String(error)).not.toContain("remote.example");

      expect(error).not.toHaveProperty("cause");
    }
  });
});
