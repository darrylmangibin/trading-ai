import type { Prisma } from "../../src/generated/prisma/client.js";
import type { DatabaseConfiguration } from "../../src/database/database.config.js";
import { createPrismaClient } from "../../src/database/prisma.factory.js";
import {
  readTestDatabaseConfiguration,
  UnsafeTestDatabaseError,
  type TestDatabaseEnvironment,
} from "./target-guard.js";

export type TestTransaction = Pick<Prisma.TransactionClient, "$queryRaw" | "$executeRaw">;

export interface TestDatabaseClient {
  $transaction<T>(
    action: (transaction: TestTransaction) => Promise<T>,
    options?: { maxWait: number; timeout: number },
  ): Promise<T>;
  $disconnect(): Promise<void>;
}

export interface TestDatabaseIdentity {
  database_name: string;
  role_name: string;
  authenticated_role: string;
  superuser: boolean;
  create_database: boolean;
  create_role: boolean;
  replication: boolean;
  bypass_rls: boolean;
  privileged_membership: boolean;
  owns_database: boolean;
  can_connect: boolean;
  can_create_temp: boolean;
  can_create_schema: boolean;
  can_create_public: boolean;
}

export class TestDatabaseIdentityError extends Error {
  readonly code = "TEST_DATABASE_IDENTITY_INVALID";

  constructor() {
    super("Test database identity or privileges are unsafe; no fixture was created.");

    this.name = "TestDatabaseIdentityError";
  }
}

export class TestDatabaseUnavailableError extends Error {
  readonly code = "TEST_DATABASE_UNAVAILABLE";

  constructor() {
    super(
      "Test database operation failed. Check the isolated service, stored test credentials, " +
        "and generated Prisma client; see docs/local-development.md. No reset was attempted.",
    );

    this.name = "TestDatabaseUnavailableError";
  }
}

export async function verifyTestDatabaseIdentity(
  transaction: TestTransaction,
): Promise<TestDatabaseIdentity> {
  const identities = await transaction.$queryRaw<TestDatabaseIdentity[]>`
    SELECT current_database() AS database_name, current_user AS role_name,
      session_user AS authenticated_role, r.rolsuper AS superuser,
      r.rolcreatedb AS create_database, r.rolcreaterole AS create_role,
      r.rolreplication AS replication, r.rolbypassrls AS bypass_rls,
      EXISTS (
        SELECT 1 FROM pg_roles AS member_role
        WHERE pg_has_role(current_user, member_role.oid, 'MEMBER')
          AND (member_role.rolsuper OR member_role.rolcreatedb OR member_role.rolcreaterole
            OR member_role.rolreplication OR member_role.rolbypassrls
            OR member_role.rolname IN ('pg_read_all_data', 'pg_write_all_data',
              'pg_read_server_files', 'pg_write_server_files', 'pg_execute_server_program',
              'pg_signal_backend'))
      ) AS privileged_membership,
      d.datdba = r.oid AS owns_database,
      has_database_privilege(current_user, current_database(), 'CONNECT') AS can_connect,
      has_database_privilege(current_user, current_database(), 'TEMP') AS can_create_temp,
      has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_schema,
      has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_public
    FROM pg_roles AS r JOIN pg_database AS d ON d.datname = current_database()
    WHERE r.rolname = current_user
  `;
  const identity = identities[0];

  if (
    identities.length !== 1 ||
    !identity ||
    identity.database_name !== "trading_test" ||
    identity.role_name !== "trading_test" ||
    identity.authenticated_role !== "trading_test" ||
    identity.can_connect !== true ||
    identity.can_create_temp !== true ||
    [
      identity.superuser,
      identity.create_database,
      identity.create_role,
      identity.replication,
      identity.bypass_rls,
      identity.privileged_membership,
      identity.owns_database,
      identity.can_create_schema,
      identity.can_create_public,
    ].some((privilege) => privilege !== false)
  ) {
    throw new TestDatabaseIdentityError();
  }

  return identity;
}

export function withProbeTransaction<T>(
  client: TestDatabaseClient,
  action: (transaction: TestTransaction) => Promise<T>,
): Promise<T> {
  return client.$transaction(
    async (transaction) => {
      // The read-only guard and every fixture operation share this exact connection.
      await verifyTestDatabaseIdentity(transaction);

      await transaction.$executeRaw`
        CREATE TEMPORARY TABLE prisma_probe (id text PRIMARY KEY, value text NOT NULL)
        ON COMMIT DROP
      `;

      return action(transaction);
    },
    { maxWait: 5000, timeout: 10000 },
  );
}

export async function withTestDatabase<T>(
  action: (client: TestDatabaseClient) => Promise<T>,
  environment: TestDatabaseEnvironment = process.env,
  factory: (configuration: DatabaseConfiguration) => TestDatabaseClient = createPrismaClient,
): Promise<T> {
  // Validate before even allocating the adapter/pool. There is no development fallback.
  const configuration = readTestDatabaseConfiguration(environment);
  let client: TestDatabaseClient | undefined;
  let outcome: { ok: true; value: T } | { ok: false; error: Error };

  try {
    client = factory(configuration);

    outcome = { ok: true, value: await action(client) };
  } catch (error) {
    // Raw Prisma/driver failures can contain supplied configuration. Report a fixed error.
    outcome = {
      ok: false,
      error:
        error instanceof TestDatabaseIdentityError || error instanceof UnsafeTestDatabaseError
          ? error
          : new TestDatabaseUnavailableError(),
    };
  }

  if (client) {
    try {
      await client.$disconnect();
    } catch {
      // Preserve a primary failure; cleanup can fail the run but cannot conceal that failure.
      if (outcome.ok) outcome = { ok: false, error: new TestDatabaseUnavailableError() };
    }
  }

  if (!outcome.ok) throw outcome.error;

  return outcome.value;
}
