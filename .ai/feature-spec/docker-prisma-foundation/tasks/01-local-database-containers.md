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

**Status:** Completed by `/check docker-prisma-foundation 01` on 2026-10-18. The repeat check passed all quality roles, 3/3 HTTP regressions, all nine local-environment scenarios, and 45/45 repaired-verifier assertions. The historical Check FAIL and its diagnostic evidence remain below; the latest Check is PASS. The user approved the plan, password separation/redaction safeguards, synthetic local verification, guide correction, and all three verifier repairs. No dependencies, application migrations, client generation, or private environment files changed.

### Source Files

- `.gitattributes` (new): enforce LF for shell and SQL files.
- `.env.example` (new): empty credential inputs and placeholder development/shadow/test URLs.
- `compose.yaml` (new): pinned database services, loopback ports, separate networks, four retained volumes, and authenticated health checks.
- `docker/postgres/entrypoint.sh` (new): validate inputs and SQL mount, suppress credential-bearing session logging, and delegate to upstream.
- `docker/postgres/dev-init.sql` (new): provision the limited development login and owned development/shadow databases and schemas.
- `docker/postgres/test-init.sql` (new): provision the admin-owned test database and CONNECT/TEMP-only test login.
- `docs/local-development.md` (new; updated by `/fix`): prerequisites, configuration, lifecycle, verification, explicit affected-service recreation after a rejected port binding, credential rotation, and upstream references.
- `README.md` (updated): link the database-only setup and startup commands.
- `.ai/feature-spec/docker-prisma-foundation/tasks/01-local-database-containers.md` (updated): record implementation and acceptance evidence.
- `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md` (updated): record built status and the next check.
- `.ai/project-progress-tracker.md` (updated): feature implementation is in progress.

### Existing Tests Updated

- None: no API/web behavior or existing test inputs changed. All four automated test levels are `none` for this task; no new specifications were written or unrelated suites run.
- Test repair: no repository test was edited; the temporary runtime verifier's recovery/restart sequencing and evidence capture were repaired in the successor recorded below.

### Verification and Acceptance

Environment: Windows host, Node 24.17.0, Docker 29.8.1, Compose 5.5.1, and the exact approved Supabase image digest. Local operator verification used synthetic process-environment credentials, including distinct SQL-sensitive application passwords. `--env-file .env.example` explicitly avoided private configuration. These are local PostgreSQL observations, not API/database-suite or production evidence.

| Task criterion | Result | Evidence |
| --- | --- | --- |
| 1 · AC-2 | Met | Only `127.0.0.1:5554` / `127.0.0.1:5556` published; both host TCP connections succeed; each container has its own network. Network-authenticated identities are `trading_dev`/`trading_dev`, `trading_shadow`/`trading_dev`, and `trading_test`/`trading_test`, with all five administrative role flags false. Development owns its database/schema. Test database owner is `supabase_admin`; test login has CONNECT/TEMP, can round-trip a temporary table, and cannot create a permanent table/schema or connect to bootstrap `postgres`. |
| 2 · AC-4 | Met | `public.foundation_verify_848ed071`, row `sentinel` / `sentinel_848ed071`, survived stop/start, forced recreation, `--build --force-recreate`, and down/up. All four named mounts and both configuration-content SHA-256 fingerprints matched before/after. Only that table was dropped; its absence was verified. Database images are upstream pins, so `--build` performs no database image build; application-image builds belong to later tasks. |
| 3 · AC-13 | Met | Each missing required input fails quiet Compose validation. Invalid/missing/duplicate administrator/application inputs and missing/directory SQL mounts fail safely before upstream init. An owned Docker publication occupying 5554 makes startup fail without fallback; releasing it permits the same target. An intentional fresh-bootstrap duplicate-role error reports SQLSTATE 42710 without credentials; retry retains the same volumes and skips incomplete initialization. Changing either development application/admin environment password makes the real health command fail safely while original credentials/data remain valid; restoring matching inputs recovers health. Fresh startup of both instances on new volume pairs was also healthy. |
| 4 · checks | Met | `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` passed on Node 24.17.0. Targeted Prettier fixed only the new guide, then the full read-only format role passed. `lint:fix` is n/a for the changed YAML/SQL/shell/Markdown/attributes files; no configured ESLint source changed. Final shell syntax passed inside the pinned image; `git diff --check` passed. |
| 5 · records | Met | Eleven repository files recorded; tracker reflects built status only. Completion remains the check workflow's decision. |

The main verification project was `trading-task01-848ed071`. Each lifecycle command used the prefix `docker compose --project-name trading-task01-848ed071 --env-file .env.example -f compose.yaml` with these exact actions:

```text
config --quiet
up -d --wait --wait-timeout 120 db-dev db-test
stop db-dev db-test
start --wait --wait-timeout 120 db-dev db-test
up -d --force-recreate --wait --wait-timeout 120 db-dev db-test
up -d --build --force-recreate --wait --wait-timeout 120 db-dev db-test
down
```

Identity/privilege/fixture queries used `docker exec -i -e PGPASSWORD -e PGCONNECT_TIMEOUT=3 <owned-container-id> psql -X -w -A -t -v ON_ERROR_STOP=1 -v VERBOSITY=sqlstate -h <db-dev|db-test> -U <intended-login> -d <intended-database>`, with SQL on stdin and credentials only in the child environment. Configuration fingerprints used sorted `sha256sum` results from `/etc/postgresql-custom`; inspection requested only mounts, ports, networks, and the static health command. Bootstrap/failure logs were checked in memory for raw, SQL-escaped, and URL-encoded synthetic credential values; none were found.

Fresh/failed-start fixtures used separate projects `trading-task01-848ed071-fresh` and `trading-task01-848ed071-failure`. The latter replaced only the disposable SQL mount and shortened its health polling. Docker Desktop shared a native Windows listener in an initial fault-fixture attempt, so the successful collision check used an owned Docker publication. One interrupted synthetic startup was unhealthy on its next start; another start recovered without repair/reset, and all later lifecycle checks plus the independent fresh-volume startup passed.

Cleanup: the identified persistence table and port-holder container are removed; all three verification projects are down. Their ten synthetic volumes remain: four each under the main/fresh prefixes, and the failed-start development data/config pair. No existing volume or unrelated service was removed. Credential-free local transcripts: `C:/Users/darryl/AppData/Local/Temp/trading-task01-848ed071/report.json` and `fresh-report.json`; final SQL-mount guards and shell syntax also passed separately.

### Configuration and Local Decisions

- New user inputs: `DEV_DB_ADMIN_PASSWORD`, `TEST_DB_ADMIN_PASSWORD`, `DEV_DB_PASSWORD`, `TEST_DB_PASSWORD`, `DEV_DATABASE_URL`, `DEV_SHADOW_DATABASE_URL`, `TEST_DATABASE_URL`.
- Internal container mappings: `APP_DB_PASSWORD`, `BOOTSTRAP_PEER_ADMIN_PASSWORD`, `BOOTSTRAP_PEER_DB_PASSWORD`; upstream `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `PGDATABASE` retain their roles. Peer inputs are unset before delegation; the database containers alone receive administrator credentials.
- Health uses service DNS because upstream container-loopback authentication is trusted; it verifies both the application and administrator stored passwords. Password logging controls cover upstream psql sessions as well as the project hook.
- Public bootstrap-database access and inherited public-schema privileges are revoked to preserve scoped identities. No product behavior, dependency, model, migration, or design contract changed; no open questions remain for this task.

Historical handoff before the repeat check: `/check docker-prisma-foundation 01`. The temporary fault-verification helper was repaired; the task assigns no automated test level and introduces no tests that mirror YAML.

### Check · historical FAIL

2026-10-18 · **FAIL**, remains In Progress · Node 24.17.0: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` passed; `npm run test:e2e` passed 1 file / 3 tests (full HTTP regression suite); shell syntax, quiet Compose validation, LF checks, and `git diff --check` passed · task-assigned automated scenarios: 0 covered · 0 partial · 0 missing · 0 accepted (all four levels explicitly `none`) · local observations: 85 passed / 2 failed, with subsequent diagnostic/recovery evidence retained separately, never substituted for the failures · criterion 1 / AC-2 partial: ordinary startup failed, but loopback bindings, distinct networks, development/shadow/test identities and limited privileges passed after restart; criterion 2 / AC-4 proven by the sentinel and matching four volume mounts/configuration checksums across stop/start, recreation, build/recreation and down/up; criterion 3 / AC-13 partial: missing/invalid inputs, port collision, intentional bootstrap failure, retained incomplete initialization, credential mismatch and safe recovery proven, but valid-config fresh startup failed; criterion 4 proven by the quality/HTTP runs; criterion 5 recorded here and in the trackers · failures: Code bug candidate, bootstrap/health startup path (cause unresolved) → `/fix docker-prisma-foundation 01`; Test bug, temporary fault helper asserts restart without confirming the failed process exited → `/test docker-prisma-foundation 01` for that helper. No application code or repository tests changed during check.

### Check Session Evidence · historical FAIL

Environment: Windows, Docker 29.8.1, Compose 5.5.1, Node 24.17.0, approved pinned Supabase image. Authorization reused the repository's selected local-check policy and the recorded synthetic-verification approval. Every check ran sequentially. Private environment files were not opened; `.env.example` and synthetic child-process environment values supplied all Docker inputs. npm roles ran with the Windows wrapper `fnm exec --using=24.17.0 cmd.exe /d /c`; the initially attempted direct npm launcher could not spawn and did not execute lint.

Automated coverage audit: all four task levels are explicitly `none`; no `this task` test-file or scenario row is missing. The required HTTP regression suite is `apps/api/test/app.e2e-spec.ts` › `API (e2e)`: health status/JSON/service contract, unprefixed-route 404, and configured-origin CORS were read, listed with `npm exec --workspace @trading/api -- vitest list test/app.e2e-spec.ts`, and passed in this session. API unit, web component and API database integration are n/a for this task; no database-suite or browser pass is claimed.

The main project was `trading-check01-9d5d0fe1`; the deliberate SQL-failure fixture used `trading-check01-9d5d0fe1-failure`. Each Compose operation used `docker compose --project-name <one of those two owned names> --env-file .env.example -f compose.yaml`; the failure fixture also used `-f C:/Users/darryl/AppData/Local/Temp/trading-check01-9d5d0fe1/failure.yaml`. The exact argv, SQL actions and credential-redaction logic are retained in the credential-free local helper sources in that directory.

| Requirement / scenario | Current evidence | Status |
| --- | --- | --- |
| AC-2 / AC-13 · normal initial startup | After the owned 5554 collision fixture was released, `up -d --wait --wait-timeout 120 db-dev db-test` exited 1: `db-test` healthy, `db-dev` unhealthy. Subsequent diagnostic startup on retained storage authenticated both original administrator/application passwords and both real health commands returned 0. Fresh and retained-storage starts are different conditions; this is not declared flaky or converted to a pass. | FAIL; startup cause unresolved → `/fix` |
| AC-2 · bindings and access after recovery | Only `127.0.0.1:5554` / `127.0.0.1:5556`; both accept host TCP connections; each database has its distinct single network. Development, shadow and test identities have all five administrative role flags false. Test ownership/CONNECT/TEMP, temporary-table round-trip/drop, permanent-table/schema denials and bootstrap-database denial passed; an incorrect development password was rejected. | Proven after recovery |
| AC-4 · retained development state | `public.foundation_verify_9d5d0fe1`, row `sentinel` / `sentinel_9d5d0fe1`, survived `stop`/`start --wait --wait-timeout 120`, `up -d --force-recreate --wait --wait-timeout 120`, `up -d --build --force-recreate --wait --wait-timeout 120`, and `down`/`up`, for both named services. All four volume mounts and both configuration fingerprints matched. `--build` recreates pinned database containers; it builds no database image. | Proven |
| AC-13 · rejected inputs and occupied port | Four missing Compose inputs, twelve invalid entrypoint-input cases, missing/directory SQL mounts, and shell syntax passed. An owned Docker publication on 5554 caused startup to fail at the requested port without fallback; only that holder was removed. | Proven |
| AC-13 · failed initialization and verifier sequencing | Injected duplicate-role SQL failed with SQLSTATE 42710 and no raw/SQL-escaped/encoded credentials. The inherited helper's immediate `up --wait` retry did not demonstrate a restart; its skip-initialization assertion failed. After the fixture was stopped, a separate explicit startup observed `Skipping initialization`, the same two volumes, absent application database/login, and the fixed health error: no automatic repair/reset. The original failed helper report is preserved. | Required safe behavior observed; helper test bug → `/test` |
| AC-13 · stored-password mismatch | Separate changes to the development application and administrator environment passwords caused the actual health command to return the fixed corrective message, while original stored credentials and the sentinel remained valid. Restoring matching inputs recovered health; data/config fingerprints matched. Captured failure/recovery logs contained no original or changed credential values. | Proven |

Artifacts: `C:/Users/darryl/AppData/Local/Temp/trading-check01-9d5d0fe1/report.json` (28 observations passed / 1 failed), `runtime-report.json` (4 / 1), `remaining-report.json` (47 / 0, explicitly additional evidence only), `diagnostic-report.json`, and `fault-continuation-report.json` (6 / 0, additional evidence only). The normal first-start container logs were removed by helper teardown before diagnosis; `/fix` must capture sanitized logs and health state before stopping a fresh reproduction.

Cleanup verified: the identified sentinel table is absent; the owned port holder and both verification projects have no remaining containers. Six newly created synthetic volumes remain (main data/config pairs plus the fault-fixture development pair), in addition to the ten historical implementation-verification volumes. No volume, private file, unrelated service, application source or repository test was removed or changed. Task and feature completion are withheld.

### Fix Investigation · 2026-10-18

**Root cause proven; classification corrected to Environment.** A rejected Docker host-port binding leaves the created `db-dev` container with an empty network map. Ordinary `up` starts that detached container without restoring its application-network attachment. PostgreSQL and its project SQL complete successfully, but service DNS and the authenticated health command fail. This is not an initialization-duration or password failure. No Compose, entrypoint, SQL, application or test change has been applied by `/fix`.

| Controlled observation | Result |
| --- | --- |
| Port occupied → `up -d db-dev` rejected → release port → ordinary `up -d --wait --wait-timeout 120 db-dev db-test` | Reproduced exit 1. The development container's network map was `{}` immediately after rejection and throughout its running/unhealthy state. Service-DNS queries and `getent ahostsv4 db-dev` failed name resolution; loopback identity queries succeeded. Project SQL finished and the final PostgreSQL server was ready at 10:02:35 UTC, before unhealthy at 10:03:29. Test remained attached and healthy. |
| Fresh control with no preceding port collision | Both services became healthy and ordinary startup exited 0. Application and administrator service-DNS queries succeeded for both instances. |
| Same port-collision trigger, then explicit affected-service recreation | Ordinary retry again left the development network map empty. Created only `public.foundation_fix_9ff0c89a`, row `sentinel` / `recovery_9ff0c89a`, through the owned detached instance's loopback connection. `up -d --no-deps --force-recreate --wait --wait-timeout 120 db-dev` exited 0, restored the exact application network, authenticated both identities through service DNS, and preserved that row, both named volumes and the configuration fingerprint. Dropped only the identified table and verified its absence. |

The clean control and recovery are separate diagnostic experiments; they do not overwrite the previous Check FAIL. Local execution authorization and synthetic-credential approval were reused. All commands used the pinned image, explicit `.env.example`, separate owned projects, and child-process credentials; no private configuration was opened or printed. Captured logs contain none of the raw, SQL-escaped or encoded synthetic credential variants.

Evidence: `C:/Users/darryl/AppData/Local/Temp/trading-fix01-9ff0c89a/collision-report.json`, `baseline-report.json`, `recovery-report.json`, and their sanitized `.log` files. Exact scripts are `reproduce.mjs` and `recovery.mjs`. Project names are `trading-fix01-9ff0c89a-collision`, `-baseline`, and `-recovery`. All three projects and their port holders are stopped/removed; ten newly created synthetic volumes remain (four collision, four control, two recovery). No existing volume or unrelated service changed. A read-only investigation subagent independently confirmed the network-boundary evidence and that extending health startup allowances would not address it.

**Approved correction applied (2026-10-18):** updated only `docs/local-development.md` under Failure recovery after the user selected “Apply this fix.” After releasing a conflicting port, the guide now explicitly recreates the affected service with the verified command above, uses `db-test` for port 5556, and retains the same Compose project/data/configuration volumes. The occupied-port row and generic retry paragraph now describe that recovery. Search found no other repository recovery path with the same omission; `scripts/rebuild-docker.mjs` already uses forced recreation. No dependency, schema, client-generation or private-file step was needed. Formatting and typecheck passed; targeted ESLint fixes are n/a for Markdown.

**Route:** the invoked `/fix` skill routed the Environment finding before application-code editing; the user then explicitly approved the concrete operating-guide correction. The temporary runtime verifier belongs to `/test docker-prisma-foundation 01`: after a rejected binding it must recreate the affected service and prove network/DNS/health recovery with the same volumes; its deliberate failed-bootstrap case must confirm process exit before asserting an actual restart. No task-assigned automated scenario is introduced. Only a new `/check` may mark this task Completed.

### Fixes

2026-10-18 · failure: ordinary startup retry after an occupied port reports `db-dev` unhealthy · proven root cause: Docker starts the previously rejected container with no network attachment, so service DNS fails despite completed PostgreSQL initialization · approved fix: `docs/local-development.md` now requires explicit affected-service `--force-recreate` after releasing the port, with the original project and retained volumes · post-edit reproduction: 17/17 local recovery checks passed using the exact documented command; network, authenticated application/administrator health, original sentinel, both volume mounts and configuration checksum were preserved · `npm exec -- prettier --write docs/local-development.md`, `npm run format:check`, `npm run typecheck`, and `git diff --check` passed on Node 24.17.0; lint/lint:fix n/a for the Markdown-only change, build n/a, task-assigned automated tests n/a (all four levels `none`) · no application or repository test edit; built, awaiting `/test` then `/check`, not Completed.

Post-edit evidence: `C:/Users/darryl/AppData/Local/Temp/trading-fix01-bc52b857/recovery-report.json` and `recovery.mjs`; project `trading-fix01-bc52b857-recovery`. The guide's command was compared directly with the executed recovery argv and matched. The unique table `public.foundation_fix_bc52b857` and row `sentinel` / `recovery_bc52b857` survived recreation, then only that table was dropped and absence verified. The port holder and project are stopped/removed, and the two new synthetic volumes remain. No private file or unrelated service was accessed or changed.

Regression handoff to `/test docker-prisma-foundation 01`: repair the temporary `C:/Users/darryl/AppData/Local/Temp/trading-check01-9d5d0fe1/verify.mjs` procedure (or an approved successor), retaining failed evidence rather than filtering it out. At the assigned local-environment level, (1) reject an owned binding collision, release only that holder, recreate only the affected service with unchanged project/volumes, and assert exact network attachment, service-DNS authentication, health and persistence; (2) for an intentionally failed bootstrap, wait for confirmed container exit before starting it again, then assert initialization was skipped and no implicit repair/reset occurred; (3) capture sanitized logs/health/network state before teardown. These are real Docker observations, not new unit tests of YAML. Keep synthetic credentials only in child environments and preserve existing volumes.

### Test Repair · 2026-10-18

**All covered:** the user approved every partial row in the repair audit. Added 0 repository tests; repaired the three local-verifier coverage gaps. Final repair scenarios: 3 covered · 0 partial · 0 missing · 0 accepted gaps. Local assertions: 45 passed · 0 failed. This repair audit covers the explicit check/fix handoff, not a new full task check; the historical Check FAIL is preserved.

#### Test Files

- `C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/verify.mjs`: approved temporary successor; 2 local Docker procedures (`recoverPortCollision`, `restartFailedBootstrap`) and their evidence/cleanup assertions, 45 assertions total. Each invocation creates a fresh project pair and artifact directory; no resume/filter path removes failed observations.
- `C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/95352d95/failure.sql` and `failure.yaml`: run-owned duplicate-role fault and isolated Compose mount/health override. Neither contains credential values.
- API unit: 0; API HTTP integration: 0; web component: 0; API database integration: 0. All four assigned automated levels remain n/a; these procedures are operator verification against owned local Docker resources, not database-suite evidence.

#### Coverage

| # | Scenario / source | Level | Final status | Test and observed outcome |
| --- | --- | --- | --- | --- |
| 1 | Port rejection and preserved recovery · AC-2, AC-4, AC-13; fix handoff | Local Docker | Covered | `verify.mjs` › `recoverPortCollision`: owned 5554 collision rejected; only holder released. Diagnostic detached startup established the unique sentinel before recovery. Exact documented `up -d --no-deps --force-recreate --wait --wait-timeout 120 db-dev` replaced only the affected container, restored its exact application network and loopback binding, authenticated application/administrator via service DNS, passed Docker/actual health, and retained the original sentinel, both named mounts and configuration SHA-256. |
| 2 | Failed bootstrap followed by an actual restart · AC-13; check handoff | Local Docker | Covered | `verify.mjs` › `restartFailedBootstrap`: intentional SQLSTATE 42710; `docker wait` confirmed natural nonzero process exit and Docker state `exited`/PID 0. Explicit `start db-dev` retained the container with a new `StartedAt`/running PID. New-process logs show skipped initialization and final readiness; original volume pair retained, development/shadow databases and development login remain absent (`f|f|f`), and the actual health command gives its fixed corrective failure. No implicit repair/reset. |
| 3 | Diagnostics survive teardown · design Security and Observability; repair handoff | Local Docker | Covered | `verify.mjs` › `capture`, final evidence checks and `finally`: seven pre-teardown snapshots/log pairs include the rejected, detached, recovered, exited and restarted states; each records health, networks and mounts. Raw output was checked for raw/SQL-escaped/URL-encoded/JSON-escaped synthetic credentials before sanitized persistence. Original verifier and both historical failed reports have identical before/after SHA-256 hashes. |

#### Fixes and Verification

- Replaced the temporary helper's ordinary recovery retry with the documented affected-service recreation, confirmed process exit before restart assertions, and captured diagnostics before teardown on success or failure. PostgreSQL readiness is observed from its actual log signal; no sleep-based synchronization, assertion retries, health-timeout extension, application changes or shared test configuration changes were used.
- Environment: Windows, Node 24.17.0, Docker 29.8.1, Compose 5.5.1, approved pinned Supabase image. Only `.env.example` and in-memory synthetic child-environment credentials were used; no private configuration was read.
- `fnm exec --using=24.17.0 node C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/verify.mjs` · 2026-10-18 · exit 0; 45/45 local assertions, all three repair scenarios covered; 10:35:31–10:36:39 UTC. Expected injected port/bootstrap/health failures were asserted as outcomes, not hidden or treated as successful commands.
- `fnm exec --using=24.17.0 cmd.exe /d /c npm exec -- prettier --write C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/verify.mjs` · 2026-10-18 · passed; targeted formatting reviewed. The matching `--check` command passed after execution.
- `fnm exec --using=24.17.0 node --check C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/verify.mjs`, `fnm exec --using=24.17.0 cmd.exe /d /c npm run format:check`, and `git diff --check` · 2026-10-18 · passed. Configured ESLint/lint:fix and typed-project checks are n/a for this out-of-repository `.mjs` helper and feature records; build n/a, no application wiring changed. No unrelated test suites ran and no rule rows changed.

Evidence directory: `C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/95352d95/`; complete `report.json` includes every assertion, sanitized command result, snapshot, before/after configuration fingerprint and historical-artifact digest. `bootstrap-restart-only.log` isolates the new process rather than inferring a restart from accumulated logs. All three nonzero child commands were the expected injected failures; no child timeout/error occurred.

Cleanup verified: projects `trading-test01-95352d95-recovery` and `trading-test01-95352d95-failure` have no remaining containers; the owned port holder is removed. Only `public.foundation_test_95352d95`, row `sentinel` / `recovery_95352d95`, was dropped and its absence verified. The four new synthetic data/configuration volumes remain under those project prefixes. Historical volumes and unrelated services were untouched. Task remains built, awaiting `/check docker-prisma-foundation 01`; only that workflow may mark it Completed.

### Check

2026-10-18 · **PASS → Completed** · Node 24.17.0: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` passed; `npm run test:e2e` passed 1/1 file and 3/3 tests (full HTTP regression suite); quiet Compose validation, pinned-image shell syntax, LF checks, and `git diff --check` passed · task-assigned automated scenarios: 0 covered · 0 partial · 0 missing · 0 accepted (all four assigned levels explicitly `none`); local-environment matrix: 9 covered · 0 partial · 0 missing · 0 accepted; repaired verifier: 45/45 assertions, all three repair scenarios covered · criterion 1 / AC-2 proven by fresh healthy startup, exact loopback bindings, distinct networks, authenticated development/shadow/test identities and scoped privileges; criterion 2 / AC-4 proven by the same sentinel across stop/start, recreation, build/recreation and down/up, with all four volume mounts and both configuration fingerprints unchanged; criterion 3 / AC-13 proven by missing/invalid input and SQL-mount rejection, occupied-port rejection and documented recovery, confirmed-exit bootstrap restart without implicit repair, stored-password mismatch/recovery and credential-free output; criterion 4 proven by the quality/HTTP runs; criterion 5 recorded in this task and the feature/project trackers · no current failure, accepted gap, application edit or test edit. The historical failed check was not retried to manufacture a pass: this is the new check after the approved guide correction and verifier repair.

### Repeat Check Evidence · 2026-10-18

Preconditions passed: built/awaiting check, Implementation Record and Tests block present, no dependencies. Coverage was audited from the task, design, HTTP test body and unchanged repaired-verifier bodies. The repository's selected local-check policy and recorded synthetic-Docker authorization were reused. No new permission, dependency installation, migration, generation, private-file access, shared-service action or Git mutation was needed.

Environment: Windows host; Node 24.17.0; Docker 29.8.1; Compose 5.5.1; the exact approved Supabase image digest. Every verification process ran sequentially. All npm commands used `fnm exec --using=24.17.0 cmd.exe /d /c`. The existing API workspace `.env` was absent; its HTTP run loaded no private configuration. Docker used explicit `--env-file .env.example`, project-owned local resources and synthetic child-environment passwords only. These are local PostgreSQL/operator observations, not Prisma/database-suite, browser or production evidence.

| # | Scenario | Source | Level | Status | Current proof |
| --- | --- | --- | --- | --- | --- |
| 1 | Fresh startup, approved bindings and intended identities | Criterion 1; AC-2 | Local environment | Covered | Project `trading-check01-4ecdf7e1` began with no named storage; ordinary `up --wait` made both services healthy. Only `127.0.0.1:5554` and `127.0.0.1:5556` published; both accepted Windows-host TCP. Each service had its exact single, distinct network; development, shadow and test authenticated as the intended login. |
| 2 | Scoped ownership and positive/negative privilege boundaries | Criterion 1; Verification Plan; design Access and Isolation | Local environment | Covered | All five administrative role flags false for the three identities. Development owns its database/schema. Test is admin-owned, CONNECT/TEMP-only, round-trips/drops a temporary fixture, and rejects permanent table/schema creation and bootstrap-database connection. Wrong development password rejected. |
| 3 | Normal lifecycle preserves development state and configuration | Criterion 2; AC-4 | Local environment | Covered | `public.foundation_check_4ecdf7e1`, row `sentinel` / `sentinel_4ecdf7e1`, survived stop/start, forced recreation, build/recreation and down/up. Ten snapshots (20 service states) retained the same four named mounts and both configuration SHA-256 fingerprints, including credential-mismatch recovery. |
| 4 | Missing/invalid configuration and unsuitable SQL mounts fail before initialization | Criterion 3; AC-13 | Local environment | Covered | Four missing Compose inputs exited 1 and named only the variable. Twelve invalid entrypoint cases and missing/directory SQL mounts exited 2 with `DB_CONFIG_INVALID`, no initialization or supplied credential output. Shell syntax and LF checks passed. |
| 5 | Occupied approved port fails without fallback | Criterion 3; AC-13 | Local Docker | Covered | Unchanged repaired `verify.mjs` › `recoverPortCollision` used an owned Docker publication on 5554, observed the rejected binding/stopped detached container, and removed only its holder. |
| 6 | Documented collision recovery restores networking/health and retains state | Criteria 1–3; AC-2/AC-4/AC-13; fix handoff | Local Docker | Covered | The same procedure executed exact affected-service `up -d --no-deps --force-recreate --wait --wait-timeout 120 db-dev`; service network/DNS, app/admin authentication, actual health and loopback binding recovered. Original sentinel, both volumes and configuration fingerprint survived. |
| 7 | Failed bootstrap exits, then an actual restart skips initialization without repair/reset | Criterion 3; AC-13; check/test handoff | Local Docker | Covered | Unchanged `verify.mjs` › `restartFailedBootstrap`: SQLSTATE 42710, `docker wait`, exited/PID 0/nonzero state, then explicit `start` with a new process time. Restart-only logs show skipped initialization; development/shadow/login remain absent, volume pair retained, actual health returns its fixed corrective message. |
| 8 | Environment password changes do not rotate stored credentials or lose data | Criterion 3; AC-13 | Local environment | Covered | Separate application/admin environment changes each made the actual configured health command exit 1 with `DB_HEALTH_FAILED`. Original admin credentials and the same sentinel remained valid. Restoring each matching input recovered Docker health, original volumes and configuration. |
| 9 | Safe diagnostics survive teardown and cleanup preserves unrelated state | Criteria 3/5; design Security and Observability; repair handoff | Local environment / Local Docker | Covered | 278 operator command records and all repaired-verifier operations had zero credential detections/process errors. Logs/state/network/mounts were saved before teardown. Historical verifier/failed-report digests unchanged; only identified fixtures removed, three owned projects down, eight new synthetic named volumes retained. |

The repaired helper ran unchanged with `fnm exec --using=24.17.0 node C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/verify.mjs` (10:42:36–10:43:45 UTC), exit 0, 45 passed / 0 failed. Its three nonzero child commands were the expected port rejection, deliberate bootstrap failure and incomplete-storage health failure. Complete current evidence is `C:/Users/darryl/AppData/Local/Temp/trading-test01-a26d514e/0a690168/report.json` and the pre-teardown snapshots/logs beside it. Projects: `trading-test01-0a690168-recovery` and `trading-test01-0a690168-failure`; only `public.foundation_test_0a690168`, row `sentinel` / `recovery_0a690168`, was dropped and absence verified.

The remaining operator actions ran once with `fnm exec --using=24.17.0 node C:/Users/darryl/AppData/Local/Temp/trading-check01-20261018/operator-observations.mjs` (10:44:29–10:46:01 UTC), exit 0. This temporary command recorder is local observation evidence, not a new repository test or test-level implementation. Exact argv, SQL, results, twenty service snapshots and sanitized logs are retained in `C:/Users/darryl/AppData/Local/Temp/trading-check01-20261018/4ecdf7e1/observations.json` and adjacent `.log` files. All 24 nonzero command results were the expected missing-input, privilege/authentication, credential-mismatch or invalid-input/mount outcomes; no timeout, signal, spawn error or unexpected failure occurred.

For that project every Compose action used `docker compose --project-name trading-check01-4ecdf7e1 --env-file .env.example -f compose.yaml`, followed by the exact documented config/up/stop/start/recreate/build/down operations. SQL used `docker exec -i -e PGPASSWORD -e PGCONNECT_TIMEOUT=3 <owned-container> psql -X -w -A -t -v ON_ERROR_STOP=1 -v VERBOSITY=sqlstate -h <service> -U <intended-login> -d <intended-database>` with SQL on stdin. Changed credentials were only child-environment overrides. Full container configuration/environment was never inspected or printed. Configuration fingerprint comparison and final cleanup were independently re-read from the completed transcript.

HTTP regression proof: `npm exec --workspace @trading/api -- vitest list test/app.e2e-spec.ts` discovered the three existing `API (e2e)` cases; their bodies and the subsequent passing full `npm run test:e2e` run prove exact health status/content type/JSON, unprefixed 404 and configured-origin CORS. API unit, web component and API database integration remain n/a for Task 01. No empty or absent test level is reported as passed; no Postman shared-workspace step ran. The API-testing skill guided the existing local contract assertions within repository policy.

Cleanup rechecked: both repaired-verifier projects and the operator project have no containers; the port holder is absent; both uniquely identified sentinel tables were removed with absence verified. Four new development/test data/configuration volumes remain under `trading-check01-4ecdf7e1`, plus two each under the two repaired-verifier project names. Historical volumes, failed evidence, unrelated services, application source and repository tests were preserved. `--build` recreated the pinned upstream database containers and did not build a database image. No Git initialization, commit or push was performed.

Next: `/test docker-prisma-foundation 02` (Frontend Test Infrastructure), preferably in a fresh `/new` context. Feature remains In Progress; only Task 01 is Completed.
