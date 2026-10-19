import { DatabaseConfigurationError, readDatabaseConfiguration } from "./database.config.js";
import { createPrismaClient } from "./prisma.factory.js";

export type DatabaseCheckResult = "DB_OK" | "DB_CONFIG_INVALID" | "DB_UNAVAILABLE" | "DB_TIMEOUT";

class DatabaseCheckTimeoutError extends Error {
  constructor() {
    super("The database check deadline elapsed.");

    this.name = "DatabaseCheckTimeoutError";
  }
}

function failureResult(error: unknown): DatabaseCheckResult {
  if (error instanceof DatabaseCheckTimeoutError) return "DB_TIMEOUT";

  if (error instanceof DatabaseConfigurationError) return "DB_CONFIG_INVALID";

  return "DB_UNAVAILABLE";
}

/** The caller supplies an absolute performance.now() deadline, including module loading. */
export async function checkDatabase(
  databaseUrl: unknown,
  deadline: number,
): Promise<DatabaseCheckResult> {
  const timeoutError = new DatabaseCheckTimeoutError();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let client: ReturnType<typeof createPrismaClient> | undefined;
  let result: DatabaseCheckResult = "DB_OK";
  const expiration = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(timeoutError),
      Math.max(0, Math.ceil(deadline - performance.now())),
    );
  });

  function remainingBudget(): number {
    const remaining = deadline - performance.now();

    if (remaining <= 0) throw timeoutError;

    return Math.ceil(remaining);
  }

  try {
    remainingBudget();

    const configuration = readDatabaseConfiguration(databaseUrl);
    const allocated = createPrismaClient(configuration, remainingBudget());

    client = allocated;

    remainingBudget();

    await Promise.race([allocated.$queryRaw`SELECT 1`, expiration]);
  } catch (error) {
    // Never retain a driver error, its cause, or the supplied URL in the result.
    result = failureResult(error);
  }

  if (client) {
    try {
      // Attempt cleanup even after expiry; racing the same promise adds no new budget.
      await Promise.race([client.$disconnect(), expiration]);
    } catch (error) {
      const cleanupResult = failureResult(error);

      if (result === "DB_OK" || cleanupResult === "DB_TIMEOUT") result = cleanupResult;
    }
  }

  clearTimeout(timer);

  return performance.now() >= deadline ? "DB_TIMEOUT" : result;
}
