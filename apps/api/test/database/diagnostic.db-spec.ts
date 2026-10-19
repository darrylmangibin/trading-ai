import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer, type Socket } from "node:net";
import { fileURLToPath } from "node:url";
import { checkDatabase, type DatabaseCheckResult } from "../../src/database/check-database.js";
import { verifyTestDatabaseIdentity, withTestDatabase } from "./fixtures.js";
import { readTestDatabaseConfiguration } from "./target-guard.js";

const compiledEntry = fileURLToPath(
  new URL("../../dist/commands/check-database.js", import.meta.url),
);
const preload = new URL("./diagnostic-preload.mjs", import.meta.url).href;
const internalBudgetMs = 5000;
// Only Node launch and OS scheduling use this allowance; the CLI retains its 5,000 ms deadline.
const launchSchedulingAllowanceMs = 1500;
const syntheticPassword = "synthetic-diagnostic-secret-marker";
const fallbackUrl = `postgresql://trading_test:${syntheticPassword}@127.0.0.1:5556/trading_test`;
const expectedOutput: Record<DatabaseCheckResult, string> = {
  DB_OK: "DB_OK: Database query and cleanup succeeded.\n",
  DB_CONFIG_INVALID:
    "DB_CONFIG_INVALID: Supply a valid explicit DATABASE_URL; see docs/local-development.md.\n",
  DB_UNAVAILABLE:
    "DB_UNAVAILABLE: Check the database service and stored credentials; see docs/local-development.md.\n",
  DB_TIMEOUT:
    "DB_TIMEOUT: Database check exceeded its five-second deadline; check the local service and retry.\n",
};

interface CommandResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  leakedInput: boolean;
  externallyTerminated: boolean;
  elapsedMs: number;
  stages: string[];
}

function runDiagnostic(
  databaseUrl?: string,
  fault?: "import-stall" | "cleanup-stall",
): Promise<CommandResult> {
  // Never inherit NODE_OPTIONS, private files, or ambient application/provider configuration.
  const environment: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
    NODE_ENV: "test",
    DEV_DATABASE_URL: fallbackUrl,
    TEST_DATABASE_URL: fallbackUrl,
    SHADOW_DATABASE_URL: fallbackUrl,
  };

  if (databaseUrl !== undefined) environment.DATABASE_URL = databaseUrl;

  if (fault) environment.DIAGNOSTIC_TEST_FAULT = fault;

  const commandArguments = fault ? ["--import", preload, compiledEntry] : [compiledEntry];
  const started = performance.now();
  const child = spawn(process.execPath, commandArguments, {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    env: environment,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    windowsHide: true,
  });
  // Both descriptors are explicitly configured as pipes above.
  const outputPipe = child.stdout!;
  const errorPipe = child.stderr!;
  let stdout = "";
  let stderr = "";
  let externallyTerminated = false;
  const stages: string[] = [];

  outputPipe.setEncoding("utf8");

  errorPipe.setEncoding("utf8");

  outputPipe.on("data", (chunk: string) => {
    stdout += chunk;
  });

  errorPipe.on("data", (chunk: string) => {
    stderr += chunk;
  });

  child.on("message", (message: unknown) => {
    if (typeof message === "string") stages.push(message);
  });

  // A broken CLI is killed only as a failing test safeguard, never counted as termination evidence.
  const safetyTimer = setTimeout(
    () => {
      externallyTerminated = true;

      child.kill("SIGKILL");
    },
    internalBudgetMs + launchSchedulingAllowanceMs + 500,
  );

  return new Promise((resolve, reject) => {
    child.once("error", () => {
      clearTimeout(safetyTimer);

      reject(new Error("Could not launch the compiled database diagnostic"));
    });

    child.once("close", (exitCode, signal) => {
      clearTimeout(safetyTimer);

      const elapsedMs = performance.now() - started;
      const sensitive = [syntheticPassword, fallbackUrl];

      if (databaseUrl) {
        sensitive.push(databaseUrl);

        try {
          const { password } = new URL(databaseUrl);

          if (password) sensitive.push(password, decodeURIComponent(password));
        } catch {
          // Malformed inputs are synthetic; the marker and complete input are already included.
        }
      }

      const leakedInput = sensitive.some(
        (value) => stdout.includes(value) || stderr.includes(value),
      );
      const redact = (value: string) =>
        sensitive.reduce((safe, secret) => safe.replaceAll(secret, "[REDACTED]"), value);

      // Failed assertions must not print even test-instance credentials from a faulty driver/CLI.
      resolve({
        exitCode,
        signal,
        stdout: redact(stdout),
        stderr: redact(stderr),
        leakedInput,
        externallyTerminated,
        elapsedMs,
        stages,
      });
    });
  });
}

function expectCommandResult(
  result: CommandResult,
  outcome: DatabaseCheckResult,
  exitCode: number,
) {
  expect(result.leakedInput).toBe(false);

  expect(result.stdout).toBe(expectedOutput[outcome]);

  expect(result.stderr).toBe("");

  expect(result.exitCode).toBe(exitCode);

  expect(result.signal).toBeNull();

  expect(result.externallyTerminated).toBe(false);

  expect(result.elapsedMs).toBeLessThanOrEqual(internalBudgetMs + launchSchedulingAllowanceMs);
}

async function tcpFixture(mode: "stall" | "close") {
  const sockets = new Set<Socket>();
  const closures: Promise<void>[] = [];
  let connections = 0;
  let receivedBytes = 0;
  const server = createServer((socket) => {
    connections += 1;

    sockets.add(socket);

    closures.push(
      new Promise<void>((resolve) => {
        socket.once("close", () => {
          sockets.delete(socket);

          resolve();
        });
      }),
    );

    socket.on("error", () => {});

    socket.on("data", (data: Buffer) => {
      receivedBytes += data.length;
    });

    if (mode === "close") socket.destroy();
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected an owned loopback TCP port");
  }

  return {
    url: `postgresql://trading_test:${syntheticPassword}@127.0.0.1:${address.port}/trading_test`,
    get connections() {
      return connections;
    },
    get receivedBytes() {
      return receivedBytes;
    },
    get activeSockets() {
      return sockets.size;
    },
    waitForSocketClosure: () => Promise.all(closures),
    async close() {
      sockets.forEach((socket) => socket.destroy());

      if (server.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }
    },
  };
}

describe("database diagnostic (guarded PostgreSQL and compiled local process)", () => {
  let databaseUrl: string;

  beforeAll(async () => {
    await access(compiledEntry);

    databaseUrl = readTestDatabaseConfiguration().connectionString;

    await withTestDatabase((client) =>
      client.$transaction((transaction) => verifyTestDatabaseIdentity(transaction)),
    );
  });

  it("runs the real Prisma read-only probe against the guarded test database", async () => {
    await expect(checkDatabase(databaseUrl, performance.now() + internalBudgetMs)).resolves.toBe(
      "DB_OK",
    );
  });

  it("exits successfully with one fixed line after a real test-database query and cleanup", async () => {
    expectCommandResult(await runDiagnostic(databaseUrl), "DB_OK", 0);
  });

  it.each([
    { reason: "missing URL despite other URL variables", value: undefined },
    { reason: "empty URL", value: "" },
    { reason: "malformed URL", value: `not-a-url:${syntheticPassword}` },
    { reason: "URL query override", value: `${fallbackUrl}?host=remote` },
  ])("exits with a safe configuration error for $reason", async ({ value }) => {
    expectCommandResult(await runDiagnostic(value), "DB_CONFIG_INVALID", 2);
  });

  it("exits with a safe unavailable result when its owned local port refuses connections", async () => {
    const fixture = await tcpFixture("stall");

    try {
      await fixture.close();

      expectCommandResult(await runDiagnostic(fixture.url), "DB_UNAVAILABLE", 1);

      expect(fixture.connections).toBe(0);
    } finally {
      await fixture.close();
    }
  });

  it("exits with a safe unavailable result when a local peer closes the connection", async () => {
    const fixture = await tcpFixture("close");

    try {
      expectCommandResult(await runDiagnostic(fixture.url), "DB_UNAVAILABLE", 1);

      await fixture.waitForSocketClosure();

      expect(fixture.connections).toBe(1);

      expect(fixture.activeSockets).toBe(0);
    } finally {
      await fixture.close();
    }
  });

  it("redacts a real test-instance authentication failure", async () => {
    const rejectedUrl = new URL(databaseUrl);

    rejectedUrl.password = syntheticPassword;

    expectCommandResult(await runDiagnostic(rejectedUrl.toString()), "DB_UNAVAILABLE", 1);
  });

  it("terminates a stalled PostgreSQL handshake at one deadline and releases the accepted socket", async () => {
    const fixture = await tcpFixture("stall");

    try {
      const result = await runDiagnostic(fixture.url);

      expectCommandResult(result, "DB_TIMEOUT", 1);

      expect(result.elapsedMs).toBeGreaterThanOrEqual(internalBudgetMs);

      await fixture.waitForSocketClosure();

      expect(fixture.connections).toBe(1);

      expect(fixture.receivedBytes).toBeGreaterThan(0);

      expect(fixture.activeSockets).toBe(0);
    } finally {
      await fixture.close();
    }
  });

  it.each([
    { fault: "import-stall", stage: "import-entered" },
    { fault: "cleanup-stall", stage: "cleanup-entered" },
  ] as const)("enforces the compiled watchdog during $fault", async ({ fault, stage }) => {
    const result = await runDiagnostic(fallbackUrl, fault);

    expectCommandResult(result, "DB_TIMEOUT", 1);

    expect(result.stages).toEqual([stage]);

    expect(result.elapsedMs).toBeGreaterThanOrEqual(internalBudgetMs);
  });
});
