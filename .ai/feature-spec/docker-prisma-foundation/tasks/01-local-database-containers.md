# Task 01: Local Database Containers

## Source

- **Feature Overview**: `.ai/feature-spec/docker-prisma-foundation/feature-overview.md` (§ Features, Scope, Success Criteria)
- **System Design**: `.ai/feature-spec/docker-prisma-foundation/system-design.md` (§ Dependencies; Data Model; Access and Isolation; Resources and Rollout; Failure and Edge Cases; Security and Observability)
- **Rules**: `.ai/code-standards.md` (§ Commands, Testing, Definition of Done, Approved foundation verification extensions); `.ai/ai-workflow-rules.md` (§ Scope, Gates, Verification); owning area rules
- **Progress Tracker**: `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md`

## Objective

The developer can start separate local Supabase PostgreSQL development/test instances at the approved ports, and development records survive normal lifecycle operations.

## Background

Depends on: none

This is the first implementation task. No database infrastructure currently exists. The accepted shadow database is migration-only scratch space on the development instance; it introduces no additional host port. Run /develop for this task. No new npm package is required.

## Scope

### In Scope

- Pinned database images, local Compose resources, credential examples, first-start SQL, and persistent data/configuration volumes.
- A guarded upstream-entrypoint wrapper and operating documentation for startup, failure recovery, and explicit credential rotation.

### Out of Scope

- Application containers, Prisma/client generation, application models/migrations, automated database test infrastructure, and full Supabase services.
- Reading or editing private environment files, initializing Git, deleting existing volumes, or changing credentials on existing volumes automatically.

## What to Implement

### 1. Provision isolated local resources

- Create database-only `compose.yaml` with loopback 5554/5556 mappings and distinct application/test networks; use the exact pinned Supabase image in the design.
- Mount separate data and configuration volumes at `/var/lib/postgresql/data` and `/etc/postgresql-custom` for each instance; preserve all four on normal shutdown.
- Retain upstream default `postgres` bootstrap database and command/configuration; mount project SQL at `/etc/postgresql.schema.sql` without replacing upstream init scripts.

### 2. Bootstrap identities without leaking credentials

- Development bootstrap creates `trading_dev` and `trading_shadow` with the scoped development login; test bootstrap creates admin-owned `trading_test` and a CONNECT/TEMP-only login, revoking inherited permissions as needed.
- Validate required inputs and distinct 64-hex administrator credentials before invoking the upstream entrypoint. Use psql environment lookup and quoted literals for application passwords; suppress credential-bearing SQL/error-statement output.
- Preserve existing-volume semantics: bootstrap does not rerun or rotate stored passwords. Report failed health/configuration safely and document explicit user-performed reconciliation.
- Add `.env.example` placeholders and `.gitattributes` for LF shell/SQL files. Document correctly percent-encoded connection URLs, volume retention, and first-start versus restart behavior.

## Files to Inspect

1. `compose.yaml` (new), `.env.example` (new), `.gitattributes` (new): resource and configuration contracts.
2. `docker/postgres/entrypoint.sh` (new): input checks and delegation to the pinned entrypoint.
3. `docker/postgres/dev-init.sql` (new), `docker/postgres/test-init.sql` (new): local database and role provisioning.
4. `docs/local-development.md` (new), `README.md`: setup instructions and links.
5. `.ai/folder-structure.md`, `.ai/architecture.md`: placement, planned foundation, and invariants.

## Contracts

Follow the cited System Design sections; do not duplicate or silently change their contract.

- **Data**: The two local database clusters, migration scratch database, and four distinct persistent volumes.
- **Inputs**: User-supplied local credentials and the approved fixed names/ports; never inspect private values.
- **Outputs**: Database identities available at loopback ports and safe bootstrap/health status.
- **Validation**: Required fields, administrator format, scoped role privileges, distinct resources, and failure without implicit reset.
- **Compatibility**: Existing app behavior and files remain outside this task; upstream Supabase initialization stays intact.

## Acceptance Criteria

1. Both instances bind only to the approved local host ports and expose the intended database/login identities. (AC-2)
2. A uniquely identified development verification record survives normal stop/start, container recreation, and rebuild; configuration volume retention is verified. (AC-4)
3. Missing/invalid inputs, occupied ports, initial bootstrap failure, and changed credentials on existing storage produce actionable outcomes without alternate ports, secret output, or automatic deletion. (AC-13)
4. Applicable lint, typecheck, format, and wiring/build checks pass; unavailable roles are reported accurately.
5. Record files, verification evidence, and current status in the feature tracker; only /check marks completion.

## Verification Plan

- Validate Compose using quiet mode after the user supplies configuration; never print resolved secret-bearing configuration.
- Start both databases and query each identity as its intended login; verify administrative privileges are absent and the test login can create a temporary table but cannot create a permanent public table.
- Create and record one development persistence fixture, perform stop/start and container recreation/rebuild, verify the same value, then remove only that fixture.
- Exercise missing/invalid synthetic bootstrap inputs and an occupied local port; inspect only sanitized results and confirm recovery preserves storage.
- Using disposable synthetic credentials, verify bootstrap logs contain no credential values. Document the explicit credential-rotation procedure without rotating user data as part of verification.

### Tests

- API unit: none · container/bootstrap lifecycle is verified in its real local environment; do not add tests mirroring YAML.
- API HTTP integration: none · this task adds no HTTP behavior.
- Web component: none · this task adds no browser behavior.
- API database integration: none · Task 04 establishes this missing level.

## Open Questions

- None; implementation findings that change a contract must return to /architect.

## Implementation Record

Not started.
