import {
  verifyTestDatabaseIdentity,
  withProbeTransaction,
  withTestDatabase,
  type TestDatabaseClient,
  type TestTransaction,
} from "./fixtures.js";

interface ProbeRow {
  id: string;
  value: string;
}

interface ProbeState {
  backend_pid: number;
  table_name: string | null;
}

async function probeState(transaction: TestTransaction): Promise<ProbeState> {
  const rows = await transaction.$queryRaw<ProbeState[]>`
    SELECT pg_backend_pid() AS backend_pid, to_regclass('pg_temp.prisma_probe')::text AS table_name
  `;

  return rows[0]!;
}

function stateAfterTransaction(client: TestDatabaseClient): Promise<ProbeState> {
  return client.$transaction(async (transaction) => {
    await verifyTestDatabaseIdentity(transaction);

    return probeState(transaction);
  });
}

async function writeAndRead(transaction: TestTransaction, value: string): Promise<ProbeRow[]> {
  const id = "probe";

  await transaction.$executeRaw`INSERT INTO prisma_probe (id, value) VALUES (${id}, ${value})`;

  return transaction.$queryRaw<ProbeRow[]>`SELECT id, value FROM prisma_probe WHERE id = ${id}`;
}

describe("Prisma isolated test instance (real PostgreSQL)", () => {
  it("connects as the expected restricted database and authenticated login", async () => {
    const identity = await withTestDatabase((client) =>
      client.$transaction((transaction) => verifyTestDatabaseIdentity(transaction)),
    );

    expect(identity).toEqual({
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
    });
  });

  it("round-trips parameterized values containing SQL-sensitive text", async () => {
    const value = "quote' slash\\ unicode 雪 ; DROP TABLE prisma_probe; --";
    const rows = await withTestDatabase((client) =>
      withProbeTransaction(client, (transaction) => writeAndRead(transaction, value)),
    );

    expect(rows).toEqual([{ id: "probe", value }]);
  });

  it("drops the successful fixture at commit on the same PostgreSQL connection", async () => {
    const result = await withTestDatabase(async (client) => {
      const during = await withProbeTransaction(client, async (transaction) => {
        await writeAndRead(transaction, "committed");

        return probeState(transaction);
      });

      return { during, after: await stateAfterTransaction(client) };
    });

    expect(result.during.table_name).toBe("prisma_probe");

    expect(result.after.backend_pid).toBe(result.during.backend_pid);

    expect(result.after.table_name).toBeNull();
  });

  it("rolls back creation and writes after a callback failure on the same connection", async () => {
    const rollback = new Error("controlled fixture rollback");
    const result = await withTestDatabase(async (client) => {
      let during: ProbeState | undefined;
      let observedFailure: unknown;

      try {
        await withProbeTransaction(client, async (transaction) => {
          await writeAndRead(transaction, "rolled back");

          during = await probeState(transaction);
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;

        observedFailure = error;
      }

      return { during, observedFailure, after: await stateAfterTransaction(client) };
    });

    expect(result.observedFailure).toBe(rollback);

    expect(result.during?.table_name).toBe("prisma_probe");

    expect(result.after.backend_pid).toBe(result.during?.backend_pid);

    expect(result.after.table_name).toBeNull();
  });

  it("rolls back after a database statement failure and permits a fresh transaction", async () => {
    const result = await withTestDatabase(async (client) => {
      let failed = false;
      let backendPid: number | undefined;

      try {
        await withProbeTransaction(client, async (transaction) => {
          backendPid = (await probeState(transaction)).backend_pid;

          await writeAndRead(transaction, "first");

          await writeAndRead(transaction, "duplicate primary key");
        });
      } catch {
        failed = true;
      }

      const after = await stateAfterTransaction(client);
      const next = await withProbeTransaction(client, (transaction) =>
        writeAndRead(transaction, "fresh"),
      );

      return { failed, backendPid, after, next };
    });

    expect(result.failed).toBe(true);

    expect(result.after.backend_pid).toBe(result.backendPid);

    expect(result.after.table_name).toBeNull();

    expect(result.next).toEqual([{ id: "probe", value: "fresh" }]);
  });

  it("starts each repeated fixture empty and leaves no persistent probe table", async () => {
    const result = await withTestDatabase(async (client) => {
      const runs = [];

      for (const value of ["first", "second", "third"]) {
        runs.push(
          await withProbeTransaction(client, async (transaction) => ({
            before: await transaction.$queryRaw<ProbeRow[]>`SELECT id, value FROM prisma_probe`,
            after: await writeAndRead(transaction, value),
          })),
        );
      }

      const permanent = await client.$transaction(async (transaction) => {
        await verifyTestDatabaseIdentity(transaction);

        return transaction.$queryRaw<{ count: number }[]>`
          SELECT count(*)::int AS count FROM pg_class
          WHERE relname = 'prisma_probe' AND relpersistence <> 't'
        `;
      });

      return { runs, permanent, final: await stateAfterTransaction(client) };
    });

    expect(result.runs).toEqual(
      ["first", "second", "third"].map((value) => ({
        before: [],
        after: [{ id: "probe", value }],
      })),
    );

    expect(result.permanent).toEqual([{ count: 0 }]);

    expect(result.final.table_name).toBeNull();
  });

  it("keeps simultaneous connections with identical temporary table names independent", async () => {
    const result = await withTestDatabase((first) =>
      withTestDatabase((second) =>
        Promise.all([
          withProbeTransaction(first, (transaction) => writeAndRead(transaction, "connection one")),
          withProbeTransaction(second, (transaction) =>
            writeAndRead(transaction, "connection two"),
          ),
        ]),
      ),
    );

    expect(result).toEqual([
      [{ id: "probe", value: "connection one" }],
      [{ id: "probe", value: "connection two" }],
    ]);
  });
});
