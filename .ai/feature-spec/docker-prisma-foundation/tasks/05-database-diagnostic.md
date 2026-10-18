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

Not started.
