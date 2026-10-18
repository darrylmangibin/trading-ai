# Local PostgreSQL development

Task 01 provides PostgreSQL only. The applications still use the native development workflow
in the [README](../README.md); Prisma and application containers arrive in later tasks.

## Prepare configuration

Use Docker Desktop with Linux containers and Docker Compose, plus Node 24.17.0 for repository
checks. Run these commands from the repository root. Check prerequisites without displaying
private configuration:

```powershell
docker version
docker compose version
if (-not (Test-Path -LiteralPath .env)) {
  Copy-Item -LiteralPath .env.example -Destination .env
}
```

Create `.env` only when it does not already exist. Fill it in a private editor. Do not share
the file, resolved Compose configuration, container environment, or raw database errors.

| Variable                  | Value supplied by the developer                                         |
| ------------------------- | ----------------------------------------------------------------------- |
| `DEV_DB_ADMIN_PASSWORD`   | Independently generated 64-character hexadecimal administrator password |
| `TEST_DB_ADMIN_PASSWORD`  | A different 64-character hexadecimal administrator password             |
| `DEV_DB_PASSWORD`         | Nonempty raw development application password                           |
| `TEST_DB_PASSWORD`        | A different nonempty raw test application password                      |
| `DEV_DATABASE_URL`        | Development application URL below; used by later Prisma tasks           |
| `DEV_SHADOW_DATABASE_URL` | Migration-only URL below; used by later Prisma tasks                    |
| `TEST_DATABASE_URL`       | Isolated test URL below; used by later test tasks                       |

For example, run this separately for each password and keep the result private:

```powershell
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"
```

Administrator passwords must be hexadecimal because the pinned upstream bootstrap interpolates
them in SQL. Application passwords support SQL-sensitive characters through psql environment
lookup and quoted literals. Compose `.env` syntax is a separate layer: single-quoted values
prevent `$` interpolation; escape an embedded single quote as `\'`. Prefer generated hexadecimal
passwords when no special characters are needed.

Only the password component of a PostgreSQL URL is percent-encoded. Keep the four password
variables raw. For example, the synthetic password `demo@p:a/ss#%` becomes
`demo%40p%3Aa%2Fss%23%25` in a URL:

```text
postgresql://trading_dev:<encoded-development-password>@127.0.0.1:5554/trading_dev
postgresql://trading_dev:<encoded-development-password>@127.0.0.1:5554/trading_shadow
postgresql://trading_test:<encoded-test-password>@127.0.0.1:5556/trading_test
```

The angle-bracket values are placeholders. For an environment-supplied raw password, PowerShell's
`[uri]::EscapeDataString($env:DEV_DB_PASSWORD)` produces its encoded password component; do this
privately. Do not encode the whole URL or encode an already encoded password again. URLs have
no query parameters or fragments. The shadow URL uses the same development password and port,
with a distinct database name. Never use `trading_shadow` for application records or tests.

## Start and stop

```powershell
docker compose config --quiet
docker compose up -d --wait --wait-timeout 120 db-dev db-test
docker compose ps
```

`config --quiet` validates without printing resolved credentials. Never use a bare
`docker compose config` or dump container inspection/environment output into reports.

| Service   | Host endpoint    | Database / login                 | Access                                                                         |
| --------- | ---------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `db-dev`  | `127.0.0.1:5554` | `trading_dev` / `trading_dev`    | Owns development database and public schema; no administrative role privileges |
| `db-dev`  | `127.0.0.1:5554` | `trading_shadow` / `trading_dev` | Migration-only scratch database owned by the same limited login                |
| `db-test` | `127.0.0.1:5556` | `trading_test` / `trading_test`  | Admin-owned database; application login has CONNECT and TEMP only              |

Both containers use PostgreSQL port 5432 internally. Each attaches only to its own application
or test network. Administrator credentials stay in the database containers. Peer credentials
are used only to reject identical environment passwords and are unset before upstream startup.
Future applications/test runners receive only their own application credentials.

Health checks authenticate as the intended application login and as `supabase_admin`, using
service DNS. This checks stored passwords; `pg_isready` and the image's trusted container-local
loopback connections cannot prove password agreement. Health failures return fixed messages.

Normal lifecycle commands preserve storage:

```powershell
docker compose stop db-dev db-test
docker compose start --wait --wait-timeout 120 db-dev db-test
docker compose up -d --force-recreate --wait --wait-timeout 120 db-dev db-test
docker compose up -d --build --force-recreate --wait --wait-timeout 120 db-dev db-test
docker compose down
```

The database services use a pinned upstream image, so `--build` does not build a database image.
The recreation still reattaches the same volumes. Application-image rebuilds in later tasks
must also preserve them. Do not add `--volumes`/`-v` to shutdown, prune volumes, or change the
Compose project name when expecting existing records.

## Storage and first initialization

Compose owns four distinct named volumes, prefixed by its project name:

| Volume           | Container path             | Retained contents                                                              |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `db-dev-data`    | `/var/lib/postgresql/data` | Development cluster, records, roles, passwords, and migration scratch database |
| `db-dev-config`  | `/etc/postgresql-custom`   | Development PostgreSQL configuration and generated key material                |
| `db-test-data`   | `/var/lib/postgresql/data` | Separate test cluster and roles                                                |
| `db-test-config` | `/etc/postgresql-custom`   | Separate test configuration and generated key material                         |

The first start validates credentials before upstream initialization. It retains upstream
`postgres` bootstrap, configuration, and init scripts, then runs the mounted project SQL at
`/etc/postgresql.schema.sql`. It creates local databases/roles only; it applies no application
migration and generates no client. Statement, error-statement, duration, and audit logging are
disabled for bootstrap sessions that handle passwords.

On later starts, upstream detects the existing cluster and skips initialization. Editing `.env`
or the bootstrap SQL does not change stored roles, passwords, privileges, or existing databases.
Recreation and rebuild are not credential rotation or bootstrap repair.

## Identity and persistence verification

Use a PostgreSQL client against the host endpoints with a password prompt or environment-supplied
password. Never put a password in command arguments, SQL pasted into reports, or a connection
URL in diagnostic output. Query `current_database()`, `current_user`, and `pg_roles` to verify
the intended identity and false `rolsuper`, `rolcreatedb`, `rolcreaterole`, `rolreplication`, and
`rolbypassrls` values. The test login must be able to create a temporary table inside a transaction
and must fail to create a permanent table in `public` or a new schema.

To verify persistence as the development login, choose a unique table and value, for example:

```sql
CREATE TABLE public.foundation_verify_<unique_id> (id text PRIMARY KEY, value text NOT NULL);
INSERT INTO public.foundation_verify_<unique_id> VALUES ('sentinel', '<unique_value>');
```

Replace the placeholders with safe identifiers/values and record them. Read that same value after
stop/start, forced recreation, and `--build --force-recreate`. Inspect only named mount metadata
to confirm the same data/config volumes, and compare a checksum of configuration contents across
those operations. Finally drop only `public.foundation_verify_<unique_id>`. Do not use a broad
cleanup or delete other developer data. Automated database integration is introduced in Task 04;
it will never receive development credentials.

## Failure recovery

| Failure                                                                    | Corrective action                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker missing or daemon unavailable                                       | Install/start the local prerequisite, then retry the same command.                                                                                                                                                                                                                                                    |
| Required password missing                                                  | Compose names the missing variable. Fill the private configuration and retry.                                                                                                                                                                                                                                         |
| Invalid administrator format or duplicate environment passwords            | `DB_CONFIG_INVALID` explains the rule without printing inputs; correct configuration and retry.                                                                                                                                                                                                                       |
| Port 5554 or 5556 occupied                                                 | Identify and release the conflicting listener, then explicitly recreate the affected service as shown below. Keep the requested port and existing Compose project/volumes. Other services may already be running.                                                                                                     |
| First initialization fails                                                 | Preserve all volumes. Check the safe error/SQLSTATE and mounted files. A cluster may already contain `PG_VERSION`, so a restart may skip incomplete bootstrap. Inspect its databases/roles as an administrator before performing a reviewed, explicit repair. Do not blindly rerun first-start SQL or delete storage. |
| Health fails after credentials change                                      | Stored credentials were not rotated. Restore the matching environment values or explicitly reconcile stored passwords below, then recreate the affected service.                                                                                                                                                      |
| Existing storage has missing roles/databases or incompatible configuration | Preserve the original data/config pair and diagnose as administrator. Correct only the identified state; never reset storage automatically.                                                                                                                                                                           |

A rejected port binding can leave the created container without a Docker network attachment.
An ordinary `up` retry can then start PostgreSQL while service DNS and health remain unavailable.
After releasing the conflicting listener, explicitly recreate only the affected service:

```powershell
docker compose config --quiet
docker compose up -d --no-deps --force-recreate --wait --wait-timeout 120 db-dev
```

For a collision on port 5556, replace `db-dev` with `db-test`. Reuse the original Compose project
and options so recreation reattaches the same named data/configuration volumes. Keep those
volumes; recreation does not rerun first-start SQL on existing storage.

After correcting other setup failures, rerun `config --quiet` and
`up -d --wait --wait-timeout 120`. Retrying retains the same data/config volume pairs. Do not
paste raw logs or inspect full container configuration; share only fixed bootstrap/health
messages, SQLSTATEs, and the observed service state.

## Explicit credential rotation

Rotation is a separate user-performed operation. Back up the matching data/config volumes and
retain the old working credentials until verification succeeds. Connect with a PostgreSQL client
as `supabase_admin` using the currently stored administrator credential. In psql, use the hidden
password prompt rather than embedding passwords in SQL:

```text
\password trading_dev
```

Use `trading_test` for the test application login. For administrator rotation, use
`\password supabase_admin`; keep the new value 64 hexadecimal characters and distinct from the
other environment. If maintaining upstream built-in login passwords, reconcile `postgres`
explicitly as well rather than rerunning upstream initialization.

Update the corresponding private raw password and URL password components, then recreate the
affected database container and later its application/test service. Confirm network-authenticated
health and the original persistence record. A failed rotation does not authorize deleting volumes.

## References

- [Pinned Supabase image](https://github.com/supabase/postgres/blob/17.6.1.136/Dockerfile-17)
- [Upstream post-initialization SQL hook](https://github.com/supabase/postgres/blob/17.6.1.136/migrations/db/migrate.sh)
- [PostgreSQL psql environment lookup and quoted interpolation](https://www.postgresql.org/docs/17/app-psql.html)
- [Docker Compose environment-file syntax](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
