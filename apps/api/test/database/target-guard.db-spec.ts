import {
  TestDatabaseIdentityError,
  TestDatabaseUnavailableError,
  withProbeTransaction,
  withTestDatabase,
  type TestDatabaseClient,
  type TestDatabaseIdentity,
  type TestTransaction,
} from "./fixtures.js";
import { readTestDatabaseConfiguration, UnsafeTestDatabaseError } from "./target-guard.js";

const nativeUrl = "postgresql://trading_test:synthetic-secret@127.0.0.1:5556/trading_test";
const dockerUrl = nativeUrl.replace("127.0.0.1:5556", "db-test:5432");
const nativeEnvironment = { TEST_DATABASE_URL: nativeUrl, TEST_DATABASE_CONTEXT: "native" };

const restrictedIdentity: TestDatabaseIdentity = {
  database_name: "trading_test",
  role_name: "trading_test",
  authenticated_role: "trading_test",
  superuser: false,
  create_database: false,
  create_role: false,
  replication: false,
  bypass_rls: false,
  privileged_membership: false,
  owns_database: false,
  can_connect: true,
  can_create_temp: true,
  can_create_schema: false,
  can_create_public: false,
};

function controlledDatabase(identities: TestDatabaseIdentity[] = [restrictedIdentity]) {
  const transaction: TestTransaction = {
    $queryRaw: vi
      .fn<TestTransaction["$queryRaw"]>()
      .mockResolvedValue(identities) as TestTransaction["$queryRaw"],
    $executeRaw: vi.fn<TestTransaction["$executeRaw"]>().mockResolvedValue(0),
  };
  const disconnect = vi.fn<TestDatabaseClient["$disconnect"]>().mockResolvedValue(undefined);
  const client: TestDatabaseClient = {
    $transaction: (action) => action(transaction),
    $disconnect: disconnect,
  };

  return { client, transaction, disconnect };
}

describe("test target guard (logic doubles; no database connection)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { context: "native", url: nativeUrl },
    { context: "native", url: nativeUrl.replace("127.0.0.1", "localhost") },
    { context: "native", url: nativeUrl.replace("postgresql:", "postgres:") },
    { context: "docker", url: dockerUrl },
    { context: "docker", url: dockerUrl.replace("synthetic-secret", "p%40ss%3A%2F%23%25") },
  ])("accepts an explicit $context test endpoint", ({ context, url }) => {
    expect(
      readTestDatabaseConfiguration({ TEST_DATABASE_URL: url, TEST_DATABASE_CONTEXT: context }),
    ).toEqual({ connectionString: url });
  });

  it.each([
    { reason: "missing URL", url: undefined },
    { reason: "null URL", url: null },
    { reason: "non-string URL", url: 5556 },
    { reason: "empty URL", url: "" },
    { reason: "malformed URL", url: "synthetic-secret" },
    { reason: "unsafe scheme", url: nativeUrl.replace("postgresql:", "https:") },
    { reason: "development port", url: nativeUrl.replace(":5556", ":5554") },
    { reason: "development database", url: nativeUrl.replace(/trading_test$/u, "trading_dev") },
    { reason: "shadow database", url: nativeUrl.replace(/trading_test$/u, "trading_shadow") },
    { reason: "development role", url: nativeUrl.replace("trading_test:", "trading_dev:") },
    { reason: "administrator role", url: nativeUrl.replace("trading_test:", "supabase_admin:") },
    { reason: "remote host", url: nativeUrl.replace("127.0.0.1", "remote.example") },
    { reason: "development service", url: dockerUrl.replace("db-test", "db-dev") },
    { reason: "missing port", url: nativeUrl.replace(":5556", "") },
    { reason: "wrong port", url: nativeUrl.replace(":5556", ":5432") },
    { reason: "invalid port", url: nativeUrl.replace(":5556", ":65536") },
    { reason: "missing password", url: nativeUrl.replace(":synthetic-secret", "") },
    { reason: "missing role", url: nativeUrl.replace("trading_test:", ":") },
    { reason: "missing database", url: nativeUrl.replace(/trading_test$/u, "") },
    { reason: "query host override", url: `${nativeUrl}?host=remote.example` },
    { reason: "query port override", url: `${nativeUrl}?port=5554` },
    { reason: "query options override", url: `${nativeUrl}?options=-csearch_path=public` },
    { reason: "empty query", url: `${nativeUrl}?` },
    { reason: "fragment", url: `${nativeUrl}#synthetic-secret` },
    { reason: "empty fragment", url: `${nativeUrl}#` },
    { reason: "multiple hosts", url: nativeUrl.replace("127.0.0.1", "localhost,remote.example") },
    { reason: "socket host", url: nativeUrl.replace("127.0.0.1", "%2Ftmp") },
    { reason: "IPv6 endpoint", url: nativeUrl.replace("127.0.0.1", "[::1]") },
    { reason: "whitespace", url: ` ${nativeUrl}` },
    { reason: "backslash", url: `${nativeUrl}\\` },
    { reason: "extra database path", url: `${nativeUrl}/extra` },
    { reason: "encoded database path", url: `${nativeUrl}%2Fextra` },
    { reason: "malformed role encoding", url: nativeUrl.replace("trading_test:", "%ZZ:") },
    { reason: "malformed password encoding", url: nativeUrl.replace("synthetic-secret", "%ZZ") },
    { reason: "malformed database encoding", url: `${nativeUrl}%ZZ` },
    { reason: "encoded control character", url: nativeUrl.replace("synthetic-secret", "p%00ss") },
  ])("rejects $reason before allocating a client or dialing", async ({ url }) => {
    const factory = vi.fn();
    const action = vi.fn();

    await expect(
      withTestDatabase(action, { ...nativeEnvironment, TEST_DATABASE_URL: url }, factory),
    ).rejects.toThrow(UnsafeTestDatabaseError);

    expect(factory).not.toHaveBeenCalled();

    expect(action).not.toHaveBeenCalled();
  });

  it.each([
    { context: undefined, url: nativeUrl },
    { context: "", url: nativeUrl },
    { context: "bypass", url: nativeUrl },
    { context: "docker", url: nativeUrl },
    { context: "native", url: dockerUrl },
  ])("refuses missing/invalid context or an endpoint from the other context", async (input) => {
    const factory = vi.fn();

    await expect(
      withTestDatabase(
        vi.fn(),
        { TEST_DATABASE_URL: input.url, TEST_DATABASE_CONTEXT: input.context },
        factory,
      ),
    ).rejects.toThrow(UnsafeTestDatabaseError);

    expect(factory).not.toHaveBeenCalled();
  });

  it("never falls back to the application URL", async () => {
    vi.stubEnv("DATABASE_URL", nativeUrl);

    vi.stubEnv("TEST_DATABASE_URL", undefined);

    vi.stubEnv("TEST_DATABASE_CONTEXT", "native");
    const factory = vi.fn();

    await expect(withTestDatabase(vi.fn(), process.env, factory)).rejects.toThrow(
      UnsafeTestDatabaseError,
    );

    expect(factory).not.toHaveBeenCalled();
  });

  it("never exposes the supplied URL, password or parser cause", () => {
    let failure: unknown;

    try {
      readTestDatabaseConfiguration({
        ...nativeEnvironment,
        TEST_DATABASE_URL: `${nativeUrl}?host=remote.example`,
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(UnsafeTestDatabaseError);

    expect(failure).toMatchObject({ code: "TEST_DATABASE_TARGET_INVALID" });

    expect(String(failure)).not.toContain("synthetic-secret");

    expect(JSON.stringify(failure)).not.toContain(nativeUrl);

    expect(failure).not.toHaveProperty("cause");
  });
});

describe("connected identity guard (controlled query results; no real server rejection)", () => {
  it.each([
    { reason: "wrong database", change: { database_name: "trading_dev" } },
    { reason: "wrong current role", change: { role_name: "trading_dev" } },
    { reason: "wrong authenticated role", change: { authenticated_role: "supabase_admin" } },
    { reason: "superuser", change: { superuser: true } },
    { reason: "database creation", change: { create_database: true } },
    { reason: "role creation", change: { create_role: true } },
    { reason: "replication", change: { replication: true } },
    { reason: "RLS bypass", change: { bypass_rls: true } },
    { reason: "privileged membership", change: { privileged_membership: true } },
    { reason: "database ownership", change: { owns_database: true } },
    { reason: "permanent schema creation", change: { can_create_schema: true } },
    { reason: "public schema creation", change: { can_create_public: true } },
    { reason: "missing CONNECT", change: { can_connect: false } },
    { reason: "missing TEMP", change: { can_create_temp: false } },
  ])("rejects $reason before any fixture DDL or callback", async ({ change }) => {
    const { client, transaction } = controlledDatabase([{ ...restrictedIdentity, ...change }]);
    const action = vi.fn();

    await expect(withProbeTransaction(client, action)).rejects.toThrow(TestDatabaseIdentityError);

    expect(transaction.$queryRaw).toHaveBeenCalledOnce();

    expect(transaction.$executeRaw).not.toHaveBeenCalled();

    expect(action).not.toHaveBeenCalled();
  });

  it.each([
    { identities: [], reason: "absent" },
    { identities: [restrictedIdentity, restrictedIdentity], reason: "ambiguous" },
  ])("rejects an $reason identity before fixture mutation", async ({ identities }) => {
    const { client, transaction } = controlledDatabase(identities);

    await expect(withProbeTransaction(client, vi.fn())).rejects.toThrow(TestDatabaseIdentityError);

    expect(transaction.$executeRaw).not.toHaveBeenCalled();
  });

  it("allows fixture DDL only after identity is verified on the callback connection", async () => {
    const { client, transaction } = controlledDatabase();
    const action = vi.fn(async (connection: TestTransaction) => {
      expect(connection).toBe(transaction);

      expect(connection.$executeRaw).toHaveBeenCalledOnce();

      return "guarded";
    });

    await expect(withProbeTransaction(client, action)).resolves.toBe("guarded");

    expect(vi.mocked(transaction.$queryRaw).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(transaction.$executeRaw).mock.invocationCallOrder[0]!,
    );
  });
});

describe("test database lifecycle failures (logic doubles)", () => {
  it("disconnects after successful work and returns its value", async () => {
    const { client, disconnect } = controlledDatabase();
    const factory = vi.fn(() => client);

    await expect(withTestDatabase(async () => "result", nativeEnvironment, factory)).resolves.toBe(
      "result",
    );

    expect(factory).toHaveBeenCalledWith({ connectionString: nativeUrl });

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("disconnects after rejected identity while preserving the safe error", async () => {
    const { client, disconnect } = controlledDatabase([]);

    await expect(
      withTestDatabase(
        (database) => withProbeTransaction(database, vi.fn()),
        nativeEnvironment,
        () => client,
      ),
    ).rejects.toThrow(TestDatabaseIdentityError);

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it.each(["allocation", "query", "cleanup"])(
    "replaces raw %s failures with a credential-free infrastructure error",
    async (stage) => {
      const rawFailure = new Error(`driver exposed ${nativeUrl}`);
      const { client, disconnect } = controlledDatabase();
      const factory = () => {
        if (stage === "allocation") throw rawFailure;

        return client;
      };

      if (stage === "cleanup") disconnect.mockRejectedValue(rawFailure);

      const action = async () => {
        if (stage === "query") throw rawFailure;

        return "result";
      };
      const failure = await withTestDatabase(action, nativeEnvironment, factory).catch(
        (error: unknown) => error,
      );

      expect(failure).toBeInstanceOf(TestDatabaseUnavailableError);

      expect(String(failure)).not.toContain("synthetic-secret");

      expect(JSON.stringify(failure)).not.toContain(nativeUrl);

      expect(failure).not.toHaveProperty("cause");

      expect(disconnect).toHaveBeenCalledTimes(stage === "allocation" ? 0 : 1);
    },
  );
});
