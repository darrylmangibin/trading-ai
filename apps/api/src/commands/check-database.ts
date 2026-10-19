import type { DatabaseCheckResult } from "../database/check-database.js";

// Keep runtime imports below the watchdog: loading Prisma consumes this same budget.
const deadline = performance.now() + 5000;
const messages: Record<DatabaseCheckResult, string> = {
  DB_OK: "DB_OK: Database query and cleanup succeeded.",
  DB_CONFIG_INVALID:
    "DB_CONFIG_INVALID: Supply a valid explicit DATABASE_URL; see docs/local-development.md.",
  DB_UNAVAILABLE:
    "DB_UNAVAILABLE: Check the database service and stored credentials; see docs/local-development.md.",
  DB_TIMEOUT:
    "DB_TIMEOUT: Database check exceeded its five-second deadline; check the local service and retry.",
};
const lifecycle: { finished: boolean; watchdog?: ReturnType<typeof setTimeout> } = {
  finished: false,
};

function finish(result: DatabaseCheckResult): never {
  lifecycle.finished = true;

  clearTimeout(lifecycle.watchdog);

  // A forced exit can truncate asynchronous pipe writes. Emit only fixed, synchronous output.
  const { writeSync } = process.getBuiltinModule("node:fs");

  writeSync(process.stdout.fd, `${messages[result]}\n`);

  process.exit(result === "DB_OK" ? 0 : result === "DB_CONFIG_INVALID" ? 2 : 1);
}

function unexpectedFailure(): void {
  if (!lifecycle.finished) {
    finish(performance.now() >= deadline ? "DB_TIMEOUT" : "DB_UNAVAILABLE");
  }
}

lifecycle.watchdog = setTimeout(
  () => finish("DB_TIMEOUT"),
  Math.max(0, Math.ceil(deadline - performance.now())),
);

// These handlers belong only to this short-lived command, never to the HTTP process.
process.on("uncaughtException", unexpectedFailure);

process.on("unhandledRejection", unexpectedFailure);

try {
  const { checkDatabase } = await import("../database/check-database.js");

  finish(await checkDatabase(process.env.DATABASE_URL, deadline));
} catch {
  unexpectedFailure();
}
