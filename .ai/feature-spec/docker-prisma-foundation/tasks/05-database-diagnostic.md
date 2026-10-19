# Task 05: Database Diagnostic

## Source

- **Feature Overview**: `.ai/feature-spec/docker-prisma-foundation/feature-overview.md` (§ Features, Scope, Success Criteria)
- **System Design**: `.ai/feature-spec/docker-prisma-foundation/system-design.md` (§ API Surface; Async and Integrations; Failure and Edge Cases; Security and Observability; Value Sourcing; Test Strategy)
- **Rules**: `.ai/code-standards.md` (§ Commands, Testing, Definition of Done, Approved foundation verification extensions); `.ai/ai-workflow-rules.md` (§ Scope, Gates, Verification); owning area rules
- **Progress Tracker**: `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md`

## Objective

The developer can run a compiled, read-only Prisma connectivity check with safe fixed output and a single five-second lifecycle deadline.

## Background

Depends on: Task 03, Task 04

This is a local command, not an HTTP readiness endpoint. Use the database factory from Task 03 and the database/fault-fixture level from Task 04. No new package is needed. Preserve the accepted exit-code contract.

## Scope

### In Scope

- Read-only probe logic, compiled command entry, one deadline, resource cleanup, typed error mapping, and documentation.
- Unit cases plus real-query and stalled-local-handshake process evidence.

### Out of Scope

- HealthController changes, retries, database writes, a new public endpoint, app startup requirements, or external service calls.

## What to Implement

### 1. Implement bounded read-only checking

- Add reusable check logic and a thin compiled command. Validate configuration, allocate Prisma, run SELECT 1, and disconnect within one 5,000 ms budget.
- Start the deadline at command entry before client creation/import work; driver phase timeouts use remaining budget. A stalled cleanup/handshake must not extend the budget.
- Use the fixed DB_OK/DB_CONFIG_INVALID/DB_UNAVAILABLE/DB_TIMEOUT outputs and accepted exits. Catch errors before any raw driver/URL data reaches output.
- The watchdog terminates only this CLI process after a fixed timeout message; successful paths clear it. Keep pure result mapping testable without exiting the test process.

### 2. Expose the command and its evidence

- API `db:check` runs the compiled command with explicitly supplied environment (optional local environment-file loading is a user runtime action). Document the required build step and the equivalent container invocation.
- Add process-level cases that start the compiled entry with a local TCP server that accepts but stalls the PostgreSQL handshake. The Task 04 container builds current API source before this suite, including the new entry; no host dist, generation, or migration is assumed. Record launch tolerance separately from the internal five-second budget.
- Exercise real test-database query success through the guarded harness. Capture safe output for malformed URL, refused connection, and timeout without revealing secrets.

## Files to Inspect

1. `apps/api/src/database/check-database.ts` (new), `apps/api/src/database/check-database.spec.ts` (new): probe/result logic.
2. `apps/api/src/commands/check-database.ts` (new): compiled command entry and deadline enforcement.
3. `apps/api/test/database/diagnostic.db-spec.ts` (new): real query and compiled-process fault fixture.
4. `apps/api/src/database/prisma.factory.ts`, `apps/api/package.json`, `docs/local-development.md`: reuse, command, and operation.

## Contracts

Follow the cited System Design sections; do not duplicate or silently change their contract.

- **Data**: No writes; only transient probe lifecycle and result.
- **Inputs**: Explicit server configuration and the fixed deadline.
- **Outputs**: One safe result with exit 0, 2, or 1 as specified in API Surface.
- **Validation**: Missing/malformed config, connection failure, shared deadline, and cleanup failures map without raw errors.
- **Compatibility**: Database-independent API startup/liveness; same generated client and configuration validation.

## Acceptance Criteria

1. The command succeeds for usable local configuration and distinguishes invalid configuration, unavailable database, and timeout with the approved safe outputs/exits. (AC-6, AC-13)
2. Validation, client creation, query, and cleanup share one five-second deadline, including a tested forced-exit fallback for stalled I/O. (AC-6)
3. Applicable lint, typecheck, format, and wiring/build checks pass; unavailable roles are reported accurately.
4. Record files, verification evidence, and current status in the feature tracker; only /check marks completion.

## Verification Plan

- Build the API, run the compiled command against the development database, then verify unavailable/malformed outcomes and safe output.
- Use the owned local stalled TCP fixture to measure termination of the compiled entry; record internal deadline and process-launch/scheduling allowance separately.
- Confirm normal/failure paths release handles and no diagnostic case mutates records or changes the health contract.

### Tests

- API unit: this task · missing/malformed config gives DatabaseConfigurationError, success result, connection error mapping, no raw secret output, cleanup behavior, and one overall timeout budget (AC-6, AC-13).
- API HTTP integration: none · command adds no HTTP contract.
- Web component: none · command adds no screen.
- API database integration: this task · guarded local Prisma SELECT succeeds; compiled CLI exits with correct code/output under invalid/refused/stalled local connection, including cleanup/termination evidence (AC-6, AC-13).

## Open Questions

- None; implementation findings that change a contract must return to /architect.

## Implementation Record

### Status

- **2026-10-18 — built; awaiting `/test`, then `/check`.** The owner approved the concrete
  development plan. Tasks 03/04 were already Completed; no blocking question or design mismatch.
- This record is implementation and regression evidence, not a completion or new-test coverage claim.

### Source Files

- `apps/api/src/database/check-database.ts` (new): reusable read-only probe, typed failure mapping,
  remaining-budget driver limits, and query/disconnect sharing one expiration promise.
- `apps/api/src/commands/check-database.ts` (new): compiled CLI; a monotonic 5,000 ms deadline begins
  before runtime imports; fixed synchronous output, approved exits, and process-only watchdog.
- `apps/api/src/database/prisma.factory.ts`: optional millisecond timeout configures pg connection,
  query and statement limits; existing callers retain their previous defaults.
- `apps/api/eslint.config.js`: permits `process.exit` only in this diagnostic entry, required by
  its accepted watchdog/exit-code contract; the Node rule remains enabled for other source.
- `apps/api/package.json`: `db:check` runs `node dist/commands/check-database.js`; existing Task 04
  scripts/dependency declarations and unrelated working changes are preserved.
- `docs/local-development.md`: native/container build and execution, explicit configuration,
  fixed results/exits, recovery, and the distinction between internal deadline and launch time.
- This task, the feature tracker, and the project progress tracker: implementation status and handoff.

### Existing Tests Updated

- None. Existing factory calls omit the optional timeout; configuration, lazy-provider, HTTP,
  and database harness contracts are unchanged. All affected existing API levels ran below.
- New `check-database.spec.ts` and `diagnostic.db-spec.ts` remain for `/test`; no new spec or
  shared test setup was written by `/develop`. Web is unchanged and its tests are unassigned here.

### Verification — 2026-10-18

All host npm commands used `fnm exec --using=24.17.0 npm.cmd` because the inherited shell defaults
to Node 23.7.0. The exact command prefix selects the pinned Node 24.17.0; no runtime was installed.

- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- eslint --max-warnings=0 --fix src/database/check-database.ts src/commands/check-database.ts src/database/prisma.factory.ts eslint.config.js` — PASS; automatic changes reviewed.
- `fnm exec --using=24.17.0 npm.cmd exec -- prettier --write apps/api/src/database/check-database.ts apps/api/src/commands/check-database.ts apps/api/src/database/prisma.factory.ts apps/api/eslint.config.js apps/api/package.json docs/local-development.md` — PASS; owned files only.
- `fnm exec --using=24.17.0 npm.cmd run typecheck` — PASS, API and web.
- `fnm exec --using=24.17.0 npm.cmd run format:check` — PASS, all matched files.
- `fnm exec --using=24.17.0 npm.cmd run build --workspace @trading/api` — PASS; the compiled command
  begins with the deadline and has no preceding runtime import.
- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- eslint --max-warnings=0 src/database/check-database.ts src/commands/check-database.ts src/database/prisma.factory.ts eslint.config.js` — PASS, read-only after formatting.
- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- vitest run src` — PASS, 3 files,
  **84/84** existing unit tests, followed sequentially by HTTP, then database regression.
- `fnm exec --using=24.17.0 npm.cmd run test:e2e` — PASS, 1 file, **12/12** HTTP cases; liveness stays
  database-independent for missing, malformed and unreachable database configuration.
- `npm run test:db` — PASS under the synthetic Compose environment below; root script executes
  `docker compose run --build --rm db-tests`, builds current API, then **77/77** existing DB tests.
  Of these, 70 are harness/guard cases and 7 use real PostgreSQL; no diagnostic specs exist yet.

### Compiled-command local evidence

- Fresh project `trading-task05-be68973b`; distinct synthetic credentials existed only in process
  memory. An explicitly empty Compose env-file override avoided private configuration. The pinned
  PostgreSQL image was already local; no host dependencies, lockfile, client or migration changed.
- `docker compose --project-name trading-task05-be68973b --env-file <evidence>/empty-compose-config -f <repo>/compose.yaml config --quiet` — PASS.
- Same Compose prefix plus `up -d --pull never --no-build --wait --wait-timeout 120 db-dev db-test`
  — PASS; owned loopback development/test instances on 5554/5556, separate volumes and networks.
- `node apps/api/dist/commands/check-database.js` with explicit, controlled child environments:
  missing URL and malformed URL each emitted one `DB_CONFIG_INVALID` line/exit 2; refused local
  connection emitted one `DB_UNAVAILABLE` line/exit 1. All had empty stderr and no URL/secret output.
- The same compiled entry queried the owned development and test instances successfully: one
  `DB_OK` line/exit 0 each, 194 ms and 184 ms process wall time. These are manual CLI checks;
  assigned real-query coverage through the guarded harness remains for `/test`.
- An owned ephemeral loopback TCP fixture accepted and stalled the PostgreSQL handshake. The
  compiled entry emitted one `DB_TIMEOUT` line/exit 1 at **5,063 ms** wall time, without external
  termination. Internal budget: **5,000 ms**; separate launch/scheduling allowance: **1,500 ms**.
  That allowance did not change the command deadline. The fixture/socket handles were closed.
- `npm run test:db` used project/file/empty-env settings supplied through Compose environment
  controls; the runner received only its normal test configuration and stayed on the test network.
- Same Compose prefix plus `down --timeout 15` — PASS. Four fresh disposable volumes were removed
  only after exact project-label and zero-container-use checks. Existing resources were untouched;
  the built image/cache and credential-free evidence remain. Final project container, volume and
  network counts are all zero. `git diff --check` also passed; the feature tracker is under 60 lines.
- Evidence: `C:/Users/darryl/AppData/Local/Temp/trading-task05-be68973b/summary.json` and sanitized
  named command logs. No synthetic credential or private environment contents were saved there.

### Acceptance and handoff

- Criterion 1: implemented; real-query success and invalid/refused/stalled compiled results observed.
  New diagnostic unit/database coverage remains pending `/test`.
- Criterion 2: implemented; one shared deadline includes cleanup, and compiled stalled-handshake
  termination was observed. Deterministic cleanup/timeout branch coverage remains pending `/test`.
- Criterion 3: met by the recorded lint, workspace typecheck, format and API build results.
- Criterion 4: met; assigned records updated. Only `/check` may mark this task Completed.
- No new environment variables, dependency changes, schema/model/migration, generated-client step,
  private-file read/edit, HTTP contract change, commit or push. No user-managed AI rules changed.
- Local decisions: pass an absolute `performance.now()` deadline to the reusable probe; use fixed
  synchronous output before command exit; allow `process.exit` only for this entry. Context7 was
  unavailable, so installed driver/types and official Node/pg documentation verified the APIs.
- **Next:** `/test docker-prisma-foundation 05`, then `/check docker-prisma-foundation 05`.

### Test Audit — 2026-10-19

- Read the task, approved contracts/design, existing source/tests and test policy. Task 05 is built;
  Tasks 03/04 are Completed. No shared test-configuration or dependency change is required.
- Initial audit: **1 covered / 0 partial / 13 missing scenario groups**. Existing typed/redacted
  configuration validation is covered by `database.config.spec.ts`; no diagnostic test exists.
- Missing unit groups: invalid-config mapping before allocation; read-only success and cleanup;
  allocation/query failure mapping and redaction without retry; awaited cleanup/error precedence;
  consumed/exhausted overall budgets; shared query/cleanup deadline and timer cleanup; optional
  remaining-budget driver limits with preserved defaults.
- Missing database/process groups: guarded real probe; compiled success; invalid/missing config;
  refused/closed/authentication-failed connections; stalled-handshake deadline and socket cleanup;
  forced-exit watchdog under stalled loading/cleanup. Launch tolerance remains separate from 5,000 ms.
- Proposed files: `apps/api/src/database/check-database.spec.ts`,
  `apps/api/src/database/prisma.factory.spec.ts`, `apps/api/test/database/diagnostic.db-spec.ts`,
  and one diagnostic-only process fault fixture in that test directory.
- Step 2 coverage-plan approval was requested through the question tool. The owner then approved
  "Write every missing and partial test": all 13 missing groups and the four proposed files.
  No accepted gap or shared test-setup change was needed.

### Test Files — 2026-10-19

- **Added 48 tests; repaired 0 existing tests.** API unit: **36 new cases** in
  `apps/api/src/database/check-database.spec.ts` (31) and
  `apps/api/src/database/prisma.factory.spec.ts` (5). The full source suite has 120 cases in 5 files.
- API database integration: `apps/api/test/database/diagnostic.db-spec.ts` (**12 new cases**).
  Three exercise real PostgreSQL (probe success, CLI success, authentication rejection);
  nine exercise local configuration/TCP/child-process faults. The full dedicated suite has
  89 cases: 70 existing harness-logic, 7 existing real-Prisma, and 12 new diagnostic cases.
- `apps/api/test/database/diagnostic-preload.mjs`: diagnostic-only child fault fixture using Node
  module hooks and IPC stage markers. It changes no on-disk runtime file or shared runner setup.
- Existing typed/redacted parser coverage is reused from
  `apps/api/src/database/database.config.spec.ts`. HTTP tests are regression evidence; web levels
  are unassigned. No application code, dependency, migration or generated client changed.

### Coverage — final re-audit, 2026-10-19

All **14 groups covered / 0 partial / 0 missing / 0 accepted gaps**, at their assigned levels:

1. **Covered — unit; Tests, AC-6/13:** `apps/api/src/database/database.config.spec.ts` ›
   `database configuration` › rejects invalid inputs with `DatabaseConfigurationError` and omits
   supplied credentials/parsing causes. Existing cases ran in the 120-case source suite.
2. **Covered — unit; Tests, AC-6/13:** `apps/api/src/database/check-database.spec.ts` ›
   `maps $reason without allocating a client`: missing, non-string, malformed/override/encoding cases.
3. **Covered — unit; Tests, Contracts:** `apps/api/src/database/check-database.spec.ts` ›
   `runs only one parameter-free SELECT and disconnects before reporting success`: exact SELECT 1
   payload, one allocation/query, no execute call, fixed DB_OK, and awaited disconnection.
4. **Covered — unit; Tests, AC-6/13:** `apps/api/src/database/check-database.spec.ts` ›
   allocation/query mapping parameterizations and synchronous query failure: typed, driver and
   non-Error failures return fixed values, retry nothing and clean up allocated resources.
5. **Covered — unit; Tests, Contracts:** `apps/api/src/database/check-database.spec.ts` ›
   `does not report success until disconnection completes`, cleanup throw/reject cases, and
   `preserves the primary failure when cleanup also fails`: deferred cleanup and error precedence.
6. **Covered — unit; Tests, design:** `apps/api/src/database/check-database.spec.ts` ›
   exhausted entry, import/validation budget, fractional remainder, exhausted validation/allocation
   cases: earlier work consumes the absolute deadline and prevents later work after expiry.
7. **Covered — unit; Tests, design:** `apps/api/src/database/check-database.spec.ts` ›
   stalled query, stalled cleanup after success/failure, simultaneous stalls, exact 4,999/5,000 ms
   boundary: one budget, cleanup attempt, timeout precedence and zero remaining timers after every case.
8. **Covered — unit; task implementation, design:** `apps/api/src/database/prisma.factory.spec.ts` ›
   `Prisma client factory`: unchanged defaults, connection/query/statement limits at 1/3,500/5,000 ms,
   correct adapter/client, disabled logs and minimal errors.
9. **Covered — database; Tests, AC-6:** `apps/api/test/database/diagnostic.db-spec.ts` ›
   `runs the real Prisma read-only probe against the guarded test database`: actual checkDatabase,
   validated explicit test target and real restricted identity preflight, DB_OK.
10. **Covered — database/process; Tests, Contracts:** `apps/api/test/database/diagnostic.db-spec.ts` ›
    `exits successfully with one fixed line after a real test-database query and cleanup`: compiled
    entry, exit 0, exact stdout, empty stderr, no leaked input, process exits without parent kill.
11. **Covered — database/process; Tests, AC-13:** `apps/api/test/database/diagnostic.db-spec.ts` ›
    `exits with a safe configuration error for $reason`: missing/empty/malformed/override inputs,
    no fallback to the three other URL variables, exact safe line and exit 2.
12. **Covered — database/process; Tests, design:** `apps/api/test/database/diagnostic.db-spec.ts` ›
    refused port, closed peer and real authentication rejection: DB_UNAVAILABLE, exit 1, exact safe
    output and empty stderr. Closed-peer socket is released; the TCP cases show no retry.
13. **Covered — database/process; Tests, AC-6:** `apps/api/test/database/diagnostic.db-spec.ts` ›
    `terminates a stalled PostgreSQL handshake at one deadline and releases the accepted socket`:
    one accepted connection with handshake bytes, DB_TIMEOUT/exit 1, natural child/socket closure,
    wall time at least 5,000 ms and at most 6,500 ms; no external termination counted as passing.
14. **Covered — database/process; Tests, design:** `apps/api/test/database/diagnostic.db-spec.ts` ›
    `enforces the compiled watchdog during $fault`: stalled import and stalled cleanup confirmed
    by child-only IPC stage markers, DB_TIMEOUT/exit 1 and the same deadline/termination assertions.

### Test Verification — 2026-10-19 (Asia/Manila)

Host commands use `fnm exec --using=24.17.0 npm.cmd`; no runtime or package was installed.

- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- eslint --max-warnings=0 --fix src/database/check-database.spec.ts src/database/prisma.factory.spec.ts test/database/diagnostic.db-spec.ts test/database/diagnostic-preload.mjs` — PASS; targeted automatic edits reviewed.
- `fnm exec --using=24.17.0 npm.cmd exec -- prettier --write apps/api/src/database/check-database.spec.ts apps/api/src/database/prisma.factory.spec.ts apps/api/test/database/diagnostic.db-spec.ts apps/api/test/database/diagnostic-preload.mjs` — PASS; later pipe declarations were formatted again with the same command restricted to `diagnostic.db-spec.ts`.
- `fnm exec --using=24.17.0 npm.cmd run typecheck --workspace @trading/api` — PASS; tests belong to this typed project.
- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- vitest list src` — discovers the source suite and both new unit specs; no database tests in that level.
- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- vitest list --config vitest.config.database.ts test/database/diagnostic.db-spec.ts` — discovers all 12 new database/process cases.
- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- vitest run src` — PASS, **120/120**, 5 files; includes 36 new cases.
- `fnm exec --using=24.17.0 npm.cmd run test:e2e` — PASS, **12/12**, 1 file; database-free HTTP regression, unassigned to the CLI's new coverage.
- `npm run test:db` — PASS, **89/89**, 3 files, in the fresh owned project below. The root role runs
  `docker compose run --build --rm db-tests`; the container first runs
  `npm run build --workspace @trading/api` (PASS), then `npm run test:database --workspace @trading/api`.
  Main verification was sequential: API unit → API HTTP → API database; no web level assigned.
- `fnm exec --using=24.17.0 npm.cmd exec --workspace @trading/api -- eslint --max-warnings=0 src/database/check-database.spec.ts src/database/prisma.factory.spec.ts test/database/diagnostic.db-spec.ts test/database/diagnostic-preload.mjs` — PASS, final read-only lint.
- `fnm exec --using=24.17.0 npm.cmd run format:check` — PASS after final targeted formatting; `git diff --check` — PASS.
- Existing changed source/setup/docs/Task04 files: **17/17 SHA-256 hashes unchanged** from the start
  of this test workflow. No shared configuration, dependency/lockfile, schema, generated output,
  private environment file, runtime application code, commit or push changed.

### Test fixes and verification correction

- Initial lint caught the deliberately non-Error throw's test-boundary type and a variable name;
  initial typecheck caught nullable child pipe types. Fixed only the new tests, preserving all cases.
- Final formatting caught a new declaration after lint; targeted Prettier write fixed it. Final lint
  and full formatting checks passed. No assertion was weakened, skipped or removed.
- A later optional `vitest list --json <source path>` command interpreted its argument as an output
  filename and temporarily overwrote the existing, initially unchanged `database.config.spec.ts`.
  Immediately restored only that file from HEAD; `git diff --exit-code -- apps/api/src/database/database.config.spec.ts`
  confirms no change. Re-ran the complete source unit role: **120/120 PASS**, then format role PASS.
  No database behavior or already-tested process code changed; no database suite rerun was needed.

### Database execution and cleanup evidence

- Harness: `fnm exec --using=24.17.0 node C:/Users/darryl/AppData/Local/Temp/trading-test05-aefa222b/verify.mjs` — PASS.
- Fresh local project `trading-test05-aefa222b`: distinct memory-only synthetic credentials;
  explicitly empty Compose configuration override; only `db-test` started on the approved loopback
  port 5556. No development database, sentinel, shared service or provider was used.
- `docker compose --project-name trading-test05-aefa222b --env-file <evidence>/empty-compose-config -f <repo>/compose.yaml config --quiet` — PASS.
- Same prefix plus `up -d --pull never --no-build --wait --wait-timeout 120 db-test` — PASS;
  root `npm run test:db` inherited the equivalent project/file/empty-env controls.
- All 12 diagnostic cases PASS. Reporter wall durations: stalled handshake **5,037 ms**;
  stalled import **5,031 ms**; stalled cleanup **5,035 ms**. Internal budget remains **5,000 ms**;
  independent launch/scheduling allowance **1,500 ms**. Exact output/exits, empty stderr, no input
  leakage, no parent kill, and local socket closure are assertions rather than manual assumptions.
- Same Compose prefix plus `down --timeout 15` — PASS. Both newly created test volumes were removed
  only after exact project-owner labels and zero-container-use checks. Final owned container,
  volume and network counts are zero. Existing projects/storage preserved; image/cache retained.
- Credential-free logs and structured evidence:
  `C:/Users/darryl/AppData/Local/Temp/trading-test05-aefa222b/summary.json` and named command logs.
- Process/database evidence ran in Docker/Linux. Host unit/types/lint/format checks ran on Windows
  with Node 24.17.0. No native database/process or web/browser pass is claimed.

### Test handoff

- **Built, awaiting `/check docker-prisma-foundation 05`.** All assigned scenarios now covered and
  passing; no application defect or design conflict found. Only `/check` may mark this task Completed.
- **Next:** `/check docker-prisma-foundation 05`; Tasks 06/07 remain outside this test workflow.
