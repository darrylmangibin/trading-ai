import {
  readDatabaseConfiguration,
  type DatabaseConfiguration,
} from "../../src/database/database.config.js";

export interface TestDatabaseEnvironment {
  TEST_DATABASE_URL?: unknown;
  TEST_DATABASE_CONTEXT?: unknown;
}

export class UnsafeTestDatabaseError extends Error {
  readonly code = "TEST_DATABASE_TARGET_INVALID";

  constructor() {
    super(
      "Unsafe test database configuration. Set TEST_DATABASE_URL and TEST_DATABASE_CONTEXT " +
        "explicitly: native uses localhost or 127.0.0.1:5556; docker uses db-test:5432. " +
        "Both require database/login trading_test, a password, and no URL overrides. " +
        "See docs/local-development.md.",
    );

    this.name = "UnsafeTestDatabaseError";
  }
}

export function readTestDatabaseConfiguration(
  environment: TestDatabaseEnvironment = process.env,
): DatabaseConfiguration {
  try {
    const configuration = readDatabaseConfiguration(environment.TEST_DATABASE_URL);
    const url = new URL(configuration.connectionString);
    const allowedEndpoint =
      (environment.TEST_DATABASE_CONTEXT === "native" &&
        ["localhost", "127.0.0.1"].includes(url.hostname) &&
        url.port === "5556") ||
      (environment.TEST_DATABASE_CONTEXT === "docker" &&
        url.hostname === "db-test" &&
        url.port === "5432");

    if (
      !allowedEndpoint ||
      decodeURIComponent(url.username) !== "trading_test" ||
      decodeURIComponent(url.pathname) !== "/trading_test"
    ) {
      throw new UnsafeTestDatabaseError();
    }

    return configuration;
  } catch {
    // Parser/decoder exceptions can contain credentials. Never retain the cause or input.
    throw new UnsafeTestDatabaseError();
  }
}
