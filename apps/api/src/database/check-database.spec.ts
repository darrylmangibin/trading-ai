import type { PrismaClient } from "../generated/prisma/client.js";
import { checkDatabase } from "./check-database.js";
import * as configuration from "./database.config.js";
import { createPrismaClient } from "./prisma.factory.js";

vi.mock("./prisma.factory.js", () => ({ createPrismaClient: vi.fn() }));

const databaseUrl = "postgresql://trading_test:synthetic-secret-marker@127.0.0.1:5556/trading_test";
const factory = vi.mocked(createPrismaClient);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((complete, fail) => {
    resolve = complete;

    reject = fail;
  });

  return { promise, resolve, reject };
}

function probeClient() {
  const query = vi
    .fn<(...arguments_: unknown[]) => Promise<unknown>>()
    .mockResolvedValue([{ value: 1 }]);
  const disconnect = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const execute = vi.fn();
  const client = {
    $queryRaw: query,
    $disconnect: disconnect,
    $executeRaw: execute,
  } as unknown as PrismaClient;

  factory.mockReturnValue(client);

  return { client, query, disconnect, execute };
}

describe("read-only database diagnostic", () => {
  beforeEach(() => {
    factory.mockReset();

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  afterEach(() => {
    const timers = vi.getTimerCount();

    vi.restoreAllMocks();

    vi.useRealTimers();

    expect(timers).toBe(0);
  });

  it.each([
    { reason: "missing configuration", value: undefined },
    { reason: "non-string configuration", value: null },
    { reason: "malformed URL", value: "synthetic-secret-marker:not-a-url" },
    { reason: "query override", value: `${databaseUrl}?host=remote` },
    { reason: "malformed credential encoding", value: databaseUrl.replace("marker", "%ZZ") },
  ])("maps $reason without allocating a client", async ({ value }) => {
    await expect(checkDatabase(value, 5000)).resolves.toBe("DB_CONFIG_INVALID");

    expect(factory).not.toHaveBeenCalled();
  });

  it("runs only one parameter-free SELECT and disconnects before reporting success", async () => {
    const { query, disconnect, execute } = probeClient();

    await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_OK");

    expect(factory).toHaveBeenCalledExactlyOnceWith({ connectionString: databaseUrl }, 5000);

    expect(query.mock.calls).toEqual([[["SELECT 1"]]]);

    expect(execute).not.toHaveBeenCalled();

    expect(disconnect).toHaveBeenCalledExactlyOnceWith();
  });

  it.each([
    {
      reason: "typed configuration error",
      error: new configuration.DatabaseConfigurationError(),
      result: "DB_CONFIG_INVALID",
    },
    {
      reason: "driver error containing credentials",
      error: new Error(`driver rejected ${databaseUrl}`),
      result: "DB_UNAVAILABLE",
    },
    { reason: "non-Error rejection", error: { connection: databaseUrl }, result: "DB_UNAVAILABLE" },
  ])(
    "maps an allocation $reason without retaining its input or retrying",
    async ({ error, result }) => {
      factory.mockImplementation(() => {
        // The cast preserves a deliberately untyped driver's non-Error throw at runtime.
        throw error as Error;
      });

      await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe(result);

      expect(factory).toHaveBeenCalledOnce();
    },
  );

  it.each([
    { reason: "connection refusal", error: new Error(`ECONNREFUSED ${databaseUrl}`) },
    {
      reason: "authentication failure",
      error: new Error(`password synthetic-secret-marker ${databaseUrl}`),
    },
    {
      reason: "driver timeout before the lifecycle deadline",
      error: new Error(`query timeout ${databaseUrl}`),
    },
    { reason: "non-Error rejection", error: { cause: databaseUrl } },
  ])(
    "maps a query $reason to one safe result and cleans up without retrying",
    async ({ error }) => {
      const { query, disconnect } = probeClient();

      query.mockRejectedValue(error);

      await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_UNAVAILABLE");

      expect(factory).toHaveBeenCalledOnce();

      expect(query).toHaveBeenCalledOnce();

      expect(disconnect).toHaveBeenCalledExactlyOnceWith();
    },
  );

  it("cleans up after a synchronous query failure", async () => {
    const { query, disconnect } = probeClient();

    query.mockImplementation(() => {
      throw new Error(databaseUrl);
    });

    await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_UNAVAILABLE");

    expect(disconnect).toHaveBeenCalledExactlyOnceWith();
  });

  it("does not report success until disconnection completes", async () => {
    const cleanup = deferred<void>();
    const { disconnect } = probeClient();

    disconnect.mockReturnValue(cleanup.promise);
    let finished = false;
    const result = checkDatabase(databaseUrl, 5000).then((value) => {
      finished = true;

      return value;
    });

    await vi.advanceTimersByTimeAsync(0);

    expect(disconnect).toHaveBeenCalledOnce();

    expect(finished).toBe(false);

    cleanup.resolve(undefined);

    await expect(result).resolves.toBe("DB_OK");
  });

  it.each(["reject", "throw"])(
    "reports unavailable when cleanup must %s after a successful query",
    async (mode) => {
      const { disconnect } = probeClient();
      const error = new Error(`cleanup synthetic-secret-marker ${databaseUrl}`);

      if (mode === "throw") {
        disconnect.mockImplementation(() => {
          throw error;
        });
      } else {
        disconnect.mockRejectedValue(error);
      }

      await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_UNAVAILABLE");
    },
  );

  it.each([
    {
      queryError: new configuration.DatabaseConfigurationError(),
      cleanupError: new Error(databaseUrl),
      result: "DB_CONFIG_INVALID",
    },
    {
      queryError: new Error(databaseUrl),
      cleanupError: new configuration.DatabaseConfigurationError(),
      result: "DB_UNAVAILABLE",
    },
  ])(
    "preserves the primary failure when cleanup also fails",
    async ({ queryError, cleanupError, result }) => {
      const { query, disconnect } = probeClient();

      query.mockRejectedValue(queryError);

      disconnect.mockRejectedValue(cleanupError);

      await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe(result);

      expect(disconnect).toHaveBeenCalledOnce();
    },
  );

  it.each([0, -1])(
    "refuses work when the entry deadline is already exhausted",
    async (deadline) => {
      await expect(checkDatabase(databaseUrl, deadline)).resolves.toBe("DB_TIMEOUT");

      expect(factory).not.toHaveBeenCalled();
    },
  );

  it("charges earlier import and validation time to the driver budget", async () => {
    const { client } = probeClient();
    const readConfiguration = configuration.readDatabaseConfiguration;

    await vi.advanceTimersByTimeAsync(1200);

    vi.spyOn(configuration, "readDatabaseConfiguration").mockImplementation((value) => {
      vi.advanceTimersByTime(300);

      return readConfiguration(value);
    });

    factory.mockReturnValue(client);

    await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_OK");

    expect(factory).toHaveBeenCalledExactlyOnceWith({ connectionString: databaseUrl }, 3500);
  });

  it("rounds a positive fractional driver budget up to one millisecond", async () => {
    probeClient();

    vi.spyOn(performance, "now").mockReturnValue(4999.75);

    await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_OK");

    expect(factory).toHaveBeenCalledExactlyOnceWith({ connectionString: databaseUrl }, 1);
  });

  it("skips allocation when validation consumes the last available time", async () => {
    const readConfiguration = configuration.readDatabaseConfiguration;

    vi.spyOn(configuration, "readDatabaseConfiguration").mockImplementation((value) => {
      const validated = readConfiguration(value);

      vi.spyOn(performance, "now").mockReturnValue(5000);

      return validated;
    });

    await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_TIMEOUT");

    expect(factory).not.toHaveBeenCalled();
  });

  it("attempts cleanup without querying when client allocation exhausts the budget", async () => {
    const { client, query, disconnect } = probeClient();

    factory.mockImplementation(() => {
      vi.spyOn(performance, "now").mockReturnValue(5000);

      return client;
    });

    await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe("DB_TIMEOUT");

    expect(query).not.toHaveBeenCalled();

    expect(disconnect).toHaveBeenCalledExactlyOnceWith();
  });

  it("expires a stalled query at the original deadline and still attempts cleanup", async () => {
    const { query, disconnect } = probeClient();

    query.mockReturnValue(deferred<unknown>().promise);

    let finished = false;
    const result = checkDatabase(databaseUrl, 5000).then((value) => {
      finished = true;

      return value;
    });

    await vi.advanceTimersByTimeAsync(4999);

    expect(finished).toBe(false);

    expect(disconnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toBe("DB_TIMEOUT");

    expect(performance.now()).toBe(5000);

    expect(disconnect).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(["success", "query failure"])(
    "gives stalled cleanup only the budget remaining after %s",
    async (outcome) => {
      const query = deferred<unknown>();
      const { query: queryMock, disconnect } = probeClient();

      queryMock.mockReturnValue(query.promise);

      disconnect.mockReturnValue(deferred<void>().promise);
      let finished = false;
      const result = checkDatabase(databaseUrl, 5000).then((value) => {
        finished = true;

        return value;
      });

      await vi.advanceTimersByTimeAsync(3000);

      if (outcome === "query failure") {
        query.reject(new Error(databaseUrl));
      } else {
        query.resolve([{ value: 1 }]);
      }

      await vi.advanceTimersByTimeAsync(0);

      expect(disconnect).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(1999);

      expect(finished).toBe(false);

      await vi.advanceTimersByTimeAsync(1);

      await expect(result).resolves.toBe("DB_TIMEOUT");

      expect(performance.now()).toBe(5000);
    },
  );

  it("does not start a second budget when query and cleanup both stall", async () => {
    const { query, disconnect } = probeClient();

    query.mockReturnValue(deferred<unknown>().promise);

    disconnect.mockReturnValue(deferred<void>().promise);
    const result = checkDatabase(databaseUrl, 5000);

    await vi.advanceTimersByTimeAsync(5000);

    await expect(result).resolves.toBe("DB_TIMEOUT");

    expect(performance.now()).toBe(5000);

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it.each([
    { finishedAt: 4999, result: "DB_OK" },
    { finishedAt: 5000, result: "DB_TIMEOUT" },
  ])(
    "honors the exact deadline when cleanup completes at $finishedAt ms",
    async ({ finishedAt, result }) => {
      const { disconnect } = probeClient();

      disconnect.mockImplementation(() => {
        vi.spyOn(performance, "now").mockReturnValue(finishedAt);

        return Promise.resolve();
      });

      await expect(checkDatabase(databaseUrl, 5000)).resolves.toBe(result);
    },
  );
});
