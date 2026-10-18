export class DatabaseConfigurationError extends Error {
  readonly code = "DB_CONFIG_INVALID";

  constructor() {
    super(
      "Invalid database configuration. Supply explicit PostgreSQL URLs without query parameters or " +
        "fragments. Migrations require the local trading_dev and trading_shadow targets; " +
        "see docs/local-development.md.",
    );

    this.name = "DatabaseConfigurationError";
  }
}

export interface DatabaseConfiguration {
  connectionString: string;
}

function parseDatabaseUrl(value: unknown): URL {
  if (typeof value !== "string" || /[\s\\?#]/u.test(value)) {
    throw new DatabaseConfigurationError();
  }

  try {
    const url = new URL(value);
    const components = [url.username, url.password, url.hostname, url.pathname.slice(1)];
    const port = Number(url.port);

    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      /[,%/]/u.test(url.hostname) ||
      components.some((component) => !component || /\p{Cc}/u.test(decodeURIComponent(component))) ||
      url.pathname.slice(1).includes("/")
    ) {
      throw new DatabaseConfigurationError();
    }

    return url;
  } catch {
    // URL/decoder errors may contain the supplied credentials; retain no cause or input.
    throw new DatabaseConfigurationError();
  }
}

export function readDatabaseConfiguration(value: unknown): DatabaseConfiguration {
  const url = parseDatabaseUrl(value);

  return { connectionString: url.toString() };
}

function migrationEndpoint(url: URL): string {
  const hostname = url.hostname.toLowerCase();

  if ((hostname === "localhost" || hostname === "127.0.0.1") && url.port === "5554") {
    return "loopback:5554";
  }

  if (hostname === "db-dev" && url.port === "5432") {
    return "db-dev:5432";
  }

  throw new DatabaseConfigurationError();
}

export function readMigrationConfiguration(databaseUrl: unknown, shadowDatabaseUrl: unknown) {
  const development = parseDatabaseUrl(databaseUrl);
  const shadow = parseDatabaseUrl(shadowDatabaseUrl);

  if (
    decodeURIComponent(development.username) !== "trading_dev" ||
    decodeURIComponent(shadow.username) !== "trading_dev" ||
    decodeURIComponent(development.pathname) !== "/trading_dev" ||
    decodeURIComponent(shadow.pathname) !== "/trading_shadow" ||
    migrationEndpoint(development) !== migrationEndpoint(shadow) ||
    decodeURIComponent(development.password) !== decodeURIComponent(shadow.password)
  ) {
    throw new DatabaseConfigurationError();
  }

  return {
    url: development.toString(),
    shadowDatabaseUrl: shadow.toString(),
  };
}
