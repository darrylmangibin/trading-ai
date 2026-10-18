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

Not started.
