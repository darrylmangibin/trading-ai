# Task 04: Database Test Infrastructure

## Source

- **Feature Overview**: `.ai/feature-spec/docker-prisma-foundation/feature-overview.md` (§ Features, Scope, Success Criteria)
- **System Design**: `.ai/feature-spec/docker-prisma-foundation/system-design.md` (§ Dependencies; Data Model; Access and Isolation; Resources and Rollout; Failure and Edge Cases; Test Strategy)
- **Rules**: `.ai/code-standards.md` (§ Commands, Testing, Definition of Done, Approved foundation verification extensions); `.ai/ai-workflow-rules.md` (§ Scope, Gates, Verification); owning area rules
- **Progress Tracker**: `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md`

## Objective

The developer can run a dedicated, repeatable Prisma database suite whose setup and cleanup are confined to the isolated test instance.

## Background

Depends on: Task 01, Task 03

This infrastructure task is built by /test. It introduces the shared container image and test service now so its command does not depend on the later API Docker task. No new package is needed beyond Task 03. Test support is not application code.

## Scope

### In Scope

- Dedicated Vitest database configuration, test target/identity guard, temporary fixtures, first database cases, and a one-shot test container.
- The shared development image, mandatory build exclusions, test-only network/configuration, and root database-test command needed by this level.

### Out of Scope

- Development data access from the runner, application migrations/models, default HTTP discovery changes, app runtime services, or live external services.

## What to Implement

### 1. Build the isolated test execution path

- Add `vitest.config.database.ts` and `.db-spec.ts` discovery outside all current HTTP/source globs. Use one worker and no file parallelism.
- Create `Dockerfile.dev` with pinned Node, Linux-installed workspace dependencies, explicit COPY paths, and mandatory `.dockerignore` exclusions for private env/credentials, host dependencies, dist, coverage, and transient output.
- Include root `tooling/eslint/` and `eslint.config.mjs` with application lint configs so workspace quality commands resolve their shared configuration inside Docker.
- Add a test-profile `db-tests` service attached only to the test network, receiving only test credentials/URL and explicit Docker execution context. It uses the already user-generated client, never generates or migrates on startup.
- Wire root `npm run test:db` to `docker compose run --build --rm db-tests` and API `test:database` to the dedicated non-watch config. The test container builds the API before invoking the suite, so compiled command fixtures exist without host dist. This build performs no generation or migration. Native execution requires the same build prerequisite and explicit loopback 5556 test environment.

### 2. Guard every fixture mutation and prove lifecycle

- Parse only TEST_DATABASE_URL; reject missing/unsafe schemes, hosts, ports, users, database names, query overrides, fragments, and malformed inputs before dialing. No fallback or bypass.
- On the same transaction connection, verify current database, authenticated role, and absence of administrative privileges before creating any fixture.
- Create the static temporary probe table with ON COMMIT DROP; use parameterized values, fresh transactions, and success/rollback cleanup. Confirm repeated runs do not share persistent state.
- Use controlled identity-query doubles to exercise wrong database/role and excessive-privilege rejection before DDL; do not grant the restricted runner privileges to manufacture those states. Separately verify the actual expected database/login and restricted privileges against real PostgreSQL, then prove round-trip, failure cleanup, and repeatability. Label logic-double and real-database evidence separately.

## Files to Inspect

1. `apps/api/vitest.config.database.ts` (new), `apps/api/test/database/target-guard.ts` (new), `apps/api/test/database/fixtures.ts` (new): support files.
2. `apps/api/test/database/target-guard.db-spec.ts` (new), `apps/api/test/database/prisma.db-spec.ts` (new): first cases.
3. `Dockerfile.dev` (new), `.dockerignore` (new), `compose.yaml`: reusable image and isolated test service.
4. `apps/api/package.json`, `package.json`, `docs/local-development.md`: separate commands and instructions.
5. `apps/api/src/database/prisma.factory.ts`, existing Vitest configs: reuse the client factory and verify unchanged discovery.

## Contracts

Follow the cited System Design sections; do not duplicate or silently change their contract.

- **Data**: Test-only temporary tables and transaction-local records; no development credentials.
- **Inputs**: Explicit test URL/context and deterministic fixtures.
- **Outputs**: Guard/identity errors or actual Prisma read/write/cleanup results.
- **Validation**: Endpoint before connection, server identity and privileges before fixture DDL, cleanup on both outcomes.
- **Compatibility**: Existing API and component suites remain service-free; shared image is available to Tasks 06/07.

## Acceptance Criteria

1. Unsafe/missing targets and unexpected connected identity/privileges fail before any fixture mutation, with safe errors. (AC-7)
2. Real Prisma operations read their written values and remove temporary fixtures after success and failure; repeated runs remain independent. (AC-8)
3. The database suite runs through an explicit isolated command, stays outside existing discovery, and fails for missing tests or infrastructure. (AC-12)
4. Applicable lint, typecheck, format, and wiring/build checks pass; unavailable roles are reported accurately.
5. Record files, verification evidence, and current status in the feature tracker; only /check marks completion.

## Verification Plan

- Validate Compose quietly, run the isolated suite twice, and record the exact test identity, result, and cleanup evidence.
- Developer creates one identified development sentinel before the suite, checks its unchanged value afterward, and removes only that fixture. The runner never receives credentials to perform this comparison.
- Inspect the test container's declared network and credential mapping without printing secret values. Verify build context excludes private files and host dependencies.
- Negative identity/privilege branches use controlled query results; positive identity/permission assertions use the real test instance. Do not redirect negative tests to a real shared/development database.

### Tests

- API unit: none · test infrastructure; guard entry-point cases belong to the dedicated harness suite.
- API HTTP integration: none · test infrastructure.
- Web component: none · test infrastructure.
- API database integration: this task · guard logic rejects unsafe targets before dialing and controlled wrong-identity/privilege query results before DDL; real PostgreSQL proves the expected restricted identity (AC-7). Real Prisma round-trip and success/failure cleanup/repeatability (AC-8), plus dedicated nonempty discovery/build and failure result (AC-12).

## Open Questions

- None; implementation findings that change a contract must return to /architect.

## Implementation Record

### Status

- 2026-10-18: **Task04 Completed** by `/check docker-prisma-foundation 04`, PASS; stop before Task05.
- Initial Git state was clean `main` at `6299a1a`; only authorized Task04 files and assigned records changed.
- No dependency, generated-client, schema/model/migration, runtime service, or Task05+ implementation.

### Implementation Files

- New: `apps/api/vitest.config.database.ts`, `apps/api/test/database/{target-guard,fixtures}.ts`,
  `apps/api/test/database/{target-guard,prisma}.db-spec.ts`, `Dockerfile.dev`, `.dockerignore`.
- Changed: `compose.yaml`, root/API `package.json`, `.env.example`, `docs/local-development.md`.
- Assigned task/tracker records updated by `/test`; existing conditional database command/level rules already approved.

### Initial Coverage Audit

All ten scenario groups were missing before implementation: unsafe target rejection before allocation;
native/Docker endpoint/context separation; controlled connected-identity/privilege rejection before DDL;
real restricted login/privileges; parameterized round-trip; success/failure cleanup; repeat independence;
separate nonempty discovery and failure propagation; image/network/credential isolation; external development sentinel.
Sources: AC-7/8/12, Contracts, cited Access/Resources/Failure/Test Strategy sections, Verification Plan.
The task authorization covers the planned files and all assigned scenarios; no additional approval was requested.

### Verification

- Node 24.17.0 via `fnm exec --using=24.17.0`: targeted ESLint --fix and API types PASS after
  repairing the cleanup-finally rule violation and generic query-double typing. No rule disabled.
- Full `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`: PASS.
- Discovery: default API config finds three source specs plus one HTTP spec; HTTP config finds only
  its HTTP spec; database config finds exactly `target-guard.db-spec.ts` and `prisma.db-spec.ts`.
- Sequential regressions: `npm exec --workspace @trading/api -- vitest run src` PASS 84/84;
  `npm run test:e2e` PASS 12/12; `npm run test --workspace @trading/web` PASS 21/21.
- The first web command used an absent `test:unit` script (exit 1); corrected to the area's
  approved Jest command above. No test, assertion, or configuration was changed for that correction.
- Initial local verification: project `trading-task04-9e438e78`, new synthetic-only credentials
  held in memory, empty Compose env-file override; both databases healthy on the approved loopback
  ports, external synthetic development sentinel created/read. First database-suite run completed successfully.
- All first-pass database, sentinel, isolation, negative-command and cleanup evidence follows below.

### Test Files

- API database integration, harness logic: `apps/api/test/database/target-guard.db-spec.ts` - 70 cases.
- API database integration, real PostgreSQL: `apps/api/test/database/prisma.db-spec.ts` - 7 cases.
- Existing regressions executed separately: API source 84, HTTP 12, web component 21.

### Coverage Re-audit

| # | Scenario / source | Level | Status | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Missing/malformed/unsafe target rejected before allocation/dialing; AC-7 | DB harness logic | covered | `target-guard.db-spec.ts` > rejects reason before allocating / never falls back / never exposes URL |
| 2 | Explicit native/Docker endpoint, password and context boundary; AC-7 | DB harness logic | covered | `target-guard.db-spec.ts` > accepts explicit endpoint / refuses missing-invalid context |
| 3 | Wrong database/current/authenticated role, elevated/creation privileges, absent/ambiguous identity; AC-7 | DB harness logic | covered | `target-guard.db-spec.ts` > connected identity guard; zero DDL/callback and ordering assertions |
| 4 | Real expected identity, CONNECT/TEMP and restricted privileges; AC-7 | Real PostgreSQL | covered | `prisma.db-spec.ts` > connects as expected restricted database/authenticated login |
| 5 | Real Prisma writes/readbacks with parameterized SQL-sensitive values; AC-8 | Real PostgreSQL | covered | `prisma.db-spec.ts` > round-trips parameterized values |
| 6 | Commit, callback-failure and SQL-failure cleanup; AC-8 | Real PostgreSQL | covered | `prisma.db-spec.ts` > successful fixture / callback failure / statement failure; backend PID equality and absent temp table |
| 7 | Repeated transactions and simultaneous connections stay independent; AC-8 | Real PostgreSQL | covered | `prisma.db-spec.ts` > starts repeated fixture empty / simultaneous connections; no permanent probe |
| 8 | Separate required nonempty discovery and actual failure propagation; AC-12 | DB suite + local CLI | covered | Three config discovery lists; `npm run test:db` twice 77/77; empty/missing-target/stopped-DB commands fail as expected |
| 9 | Shared image build exclusions, quality files, test-only network/credentials/mounts; Contracts | Local Docker | covered | Synthetic canaries absent; image lint PASS; one test network, no mounts, only test URL/context; dev DNS refused |
| 10 | External development sentinel before/after and precise cleanup; AC-8 | Local environment | covered | `task04_verify_9e438e78` retains `task04_preserved_9e438e78`; only that table removed; runner never has dev credentials |

Scenarios: **10 covered / 0 partial / 0 missing / 0 accepted gaps**. Identity negatives are controlled
query-result doubles, not real elevated roles or claims of real-server rejection. Real restricted
identity/privileges and temporary transaction behavior are separately asserted against PostgreSQL.

### Test Workflow Result - 2026-10-18

- **Built, awaiting `/check docker-prisma-foundation 04`.** All 77 dedicated cases passed twice;
  all ten scenario groups covered. User-authorized checks continue in the same Task04 context.
- Host runtime: Node 24.17.0 via `fnm exec --using=24.17.0`; `NODE_ENV=test` and absent inherited
  `DATABASE_URL`/`SHADOW_DATABASE_URL`. No private env file or broker/provider credential inspected.
- Commands: targeted API `eslint --max-warnings=0 --fix` (reviewed), full `npm run lint`,
  `npm run typecheck`, `npm run format:check`, `npm run build`, and `git diff --check` PASS.
- Discovery: `npm exec --workspace @trading/api -- vitest list --filesOnly` (three source + one HTTP),
  `vitest list --config vitest.config.e2e.ts --filesOnly` (one HTTP), and
  `vitest list --config vitest.config.database.ts --filesOnly` (two DB specs) PASS.
- Test order: API `vitest run src` 84/84 -> `npm run test:e2e` 12/12 ->
  `npm run test --workspace @trading/web` 21/21 -> root `npm run test:db` 77/77 twice.
  One test process at a time; no watch/retry. Initial absent web-script invocation was corrected
  to the documented area command, without test/config changes.
- Local command harness: `fnm exec --using=24.17.0 node C:/Users/darryl/Documents/Codex/2026-10-18/task-3/verify-task04.mjs`.
  Project `trading-task04-9e438e78`, empty Compose env-file override, new in-memory synthetic
  passwords; exact root database command `docker compose run --build --rm db-tests` twice.
- `docker compose config --quiet` and `up -d --pull never --no-build --wait --wait-timeout 120 db-dev db-test` PASS.
  Published endpoints remain 127.0.0.1:5554/5556; actual test identity is `trading_test` database/login/session.
- External development sentinel: separate `compose exec -T -e PGPASSWORD db-dev psql -X -w -A -t
  -v ON_ERROR_STOP=1 -h db-dev -U trading_dev -d trading_dev`; CREATE/INSERT/read before,
  exact-value read after both runs, then DROP only the identified table. All PASS.
- Isolation: runner attached only to `trading-task04-9e438e78_test`; mount list empty; env names
  only TEST_DATABASE_URL, TEST_DATABASE_CONTEXT, NODE_ENV and base Node/PATH/Yarn variables.
  Runtime resolves db-test and cannot resolve db-dev. Image includes generated client and compiled
  API after an in-container build; shared/application ESLint files resolve; in-container `npm run lint` PASS.
- Build canaries: synthetic env/key/credentials/secrets/host-node_modules/dist/coverage/tmp excluded.
  Review then added explicit common credential-file exclusions; final Check proved them with canaries. Existing user-generated source remains included.
- Actual negative commands: `compose run --rm --no-deps db-tests npm run test:database --workspace @trading/api -- does-not-exist-task04`
  exits 1 with `No test files found`; `-e TEST_DATABASE_URL=` plus real-spec filter exits 1 with
  `UnsafeTestDatabaseError`; after stopping only the owned db-test, the real-spec command exits 1
  with `TestDatabaseUnavailableError`. These expected failures are distinct from passing case counts.
- Resource cleanup PASS: sentinel absent, one-shot/isolation/database containers and project networks
  removed, each of four new volumes removed only after exact project-label and zero-container-use checks.
  Synthetic build canaries removed; retained images/build cache contain no supplied credentials.
- Credential-free local transcript and structured evidence:
  `C:/Users/darryl/AppData/Local/Temp/trading-task04-9e438e78/summary.json` plus its named logs.
- No package version/lockfile, production API/web source, schema/model/migration, generated host client,
  runtime service or Task05+ change. Existing conditional database Commands/Levels and setup rules
  already cover this task, so user-managed general rule files remain unchanged.

### Fixes

- Reworked safe cleanup to preserve the primary error without throwing from `finally`; gave the
  controlled generic Prisma query double its explicit test-only type. Lint/types subsequently PASS.
- Added explicit common credential-file exclusions during review; no lint rule disabled and no
  assertion weakened, removed, skipped, or retried into a pass.

### Check

- **2026-10-18 - PASS -> Completed.** Read-only full lint, workspace typecheck, format, build and
  diff checks PASS; sequential regression levels API unit **84/84**, HTTP **12/12**, web **21/21**;
  dedicated DB suite **77/77 twice** (70 harness logic + 7 real PostgreSQL). Scenarios:
  **10 covered / 0 partial / 0 missing / 0 accepted gaps**. Every process exited; no timeout/watch/retry.
- Preconditions: Task04 built/awaiting-check record and Test Files/Coverage present; Tasks01/03
  Completed. Read the current test bodies and approved contracts; all ten matrix groups covered.
  The existing consent and explicit Task04 completion authorization cover this gate; no repeat approval.
- Read-only check order on Node 24.17.0: `npm run lint` -> `npm run typecheck` ->
  `npm run format:check` -> `npm run build` -> `npm exec --workspace @trading/api -- vitest run src`
  -> `npm run test:e2e` -> `npm run test --workspace @trading/web` -> database level. All PASS.
  `git diff --check` PASS. No lint fixes or code/test edits were performed during `/check`.
- Database/local gate: `fnm exec --using=24.17.0 node C:/Users/darryl/Documents/Codex/2026-10-18/task-3/verify-task04.mjs --check`.
  Fresh project `trading-check04-83de061a`, four new owned volumes, distinct memory-only synthetic
  credentials, empty Compose env-file override. `config --quiet`, authenticated DB health and both
  root `npm run test:db` invocations PASS; each container compiled the API before running the suite.
- Acceptance 1 / AC-7: unsafe targets/context fail before adapter allocation, controlled wrong
  identity/privilege results fail before fixture DDL, actual database/current/session identity is
  `trading_test` with CONNECT/TEMP and all checked administrative/permanent-creation privileges false.
  Safe target and raw allocation/query/cleanup-error redaction cases PASS. Negative identity cases
  remain logic-double evidence; no real elevated role or development target was manufactured.
- Acceptance 2 / AC-8: real parameterized round-trip, successful commit cleanup, callback/SQL-error
  rollback, same-backend absence checks, three independent transactions, and simultaneous connection
  isolation PASS. External synthetic development sentinel `public.task04_verify_83de061a` retained
  exact value `task04_preserved_83de061a` across both runs; only that table was then dropped.
- Acceptance 3 / AC-12: dedicated discovery remains outside default/API HTTP globs; actual separate
  root command runs a required nonempty suite twice. Empty selection exits 1 with `No test files found`,
  missing URL exits 1 with `UnsafeTestDatabaseError`, stopped owned test DB exits 1 with the fixed
  `TestDatabaseUnavailableError`. Expected negative failures are recorded separately from 77/77 passes.
- Acceptance 4: host quality/build commands and in-container `npm run lint` PASS. Current image
  canaries confirm exclusion of private env, `.npmrc`, `.netrc`, `.envrc`, `.docker`, credentials,
  secrets, keys, host node_modules, dist, coverage and tmp. Required generated source, compiled API,
  root/application ESLint configs and `tooling/eslint/` exist. Runner network is solely
  `trading-check04-83de061a_test`, mounts empty, only test configuration supplied, dev DNS unresolved.
- Acceptance 5: task and both assigned progress summaries updated. Final read-only review found no
  blocking defect or design divergence. No general rule/skill, dependency version/lockfile,
  production API/web source, migration/model, generated host client, commit or push changed.
- Cleanup PASS: identified sentinel removed, runner/database containers and project networks down;
  four volumes removed after exact owner-label and zero-container-use checks; synthetic canaries absent.
  Final project container/volume counts are zero. Existing projects/storage preserved; image/build cache retained.
- Detailed current evidence: `C:/Users/darryl/AppData/Local/Temp/trading-check04-83de061a/summary.json`
  and its named command logs. Earlier /test evidence remains at `Temp/trading-task04-9e438e78`.
- Scope limits: real database execution used Docker; native endpoints/context have controlled guard
  coverage and documented explicit build prerequisite. Browser integration and codegen/migration roles
  are unassigned here, n/a rather than passes. No broker/trading/shared-service work performed.
- **Next:** stop as instructed. Task05 is not started; a future authorized task uses a fresh context.
