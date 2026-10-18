# Task 06: API Docker Development

## Source

- **Feature Overview**: `.ai/feature-spec/docker-prisma-foundation/feature-overview.md` (§ Features, Scope, Success Criteria)
- **System Design**: `.ai/feature-spec/docker-prisma-foundation/system-design.md` (§ API Surface; Public API and Compatibility; Resources and Rollout; Failure and Edge Cases; Security and Observability; Test Strategy)
- **Rules**: `.ai/code-standards.md` (§ Commands, Testing, Definition of Done, Approved foundation verification extensions); `.ai/ai-workflow-rules.md` (§ Scope, Gates, Verification); owning area rules
- **Progress Tracker**: `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md`

## Objective

The API runs in Docker at host port 9876 with reliable Windows source reload and unchanged liveness, while database checks remain separate.

## Background

Depends on: Task 01, Task 03, Task 05

Reuse the shared image introduced in Task 04, which is a transitive prerequisite through Task 05. Follow NestJS guidance and Postman API engineering for the existing OpenAPI metadata. No new npm package is needed.

## Scope

### In Scope

- API Compose service, source mounts/polling, port/origin defaults, generated-client prerequisite checks, liveness health check, and API address documentation.
- Verification of mandatory build-context exclusions and credential mapping on the shared image.

### Out of Scope

- Frontend container/proxy wiring, production images, automatic installation/codegen/migrations on startup, and database-dependent liveness.

## What to Implement

### 1. Configure the API runtime

- Update default API PORT to 9876 and CORS_ORIGIN to http://localhost:6789 while preserving explicit overrides and validation.
- Add the API service to the application network, listening on the container interface and published only to loopback 9876. Inject only development server configuration, not admin or test credentials.
- Mount API source including the generated client path, retain Linux dependencies, and enable TypeScript file/directory polling only for Docker development.
- Reuse the shared image; add a small startup check with an actionable message when the generated client is missing. Generation is a separate user-invoked one-shot command, never a startup side effect.

### 2. Preserve contract and safe lifecycle

- Use /api/health for API container health, with no database-readiness dependency. Reuse shutdown hooks and database provider cleanup.
- Update only the API server address metadata in docs/openapi.yaml plus API environment examples and instructions; preserve the response/schema/prefix.
- Require explicit Docker COPY paths and `.dockerignore` protection introduced in Task 04; verify the actual image contains no private configuration.
- Document failed startup, occupied port recovery, explicit generation, diagnostic use, and ordinary data-preserving shutdown.

## Files to Inspect

1. `compose.yaml`, `Dockerfile.dev`, `.dockerignore`: existing image/test setup and new API service.
2. `docker/api/entrypoint.sh` (new): generated-client prerequisite check without mutation.
3. `apps/api/src/config/environment.ts`, `apps/api/src/main.ts`, `apps/api/.env.example`: defaults and container listening.
4. `apps/api/src/config/environment.spec.ts` (new), `apps/api/test/app.e2e-spec.ts`: default/validation and HTTP regression cases.
5. `docs/openapi.yaml`, `apps/api/README.md`, `docs/local-development.md`: API address and local operations.

## Contracts

Follow the cited System Design sections; do not duplicate or silently change their contract.

- **Data**: Existing development storage; runtime process state only.
- **Inputs**: Approved port/origin, development URL, generated client, and host source changes.
- **Outputs**: Local API and liveness on 9876, reload results, and safe startup errors.
- **Validation**: Port validation, strict host mapping, generated-client presence, no secret build inputs.
- **Compatibility**: Unchanged public health body/prefix/CORS behavior, database independence, and explicit tooling gates.

## Acceptance Criteria

1. API is available at the approved local port and configured frontend origin, with the documented address aligned. (AC-1, AC-9)
2. A Windows host source edit rebuilds/reloads the running API; shutdown/restart releases resources normally. (AC-3)
3. Liveness remains available with the database down; missing generation, invalid configuration, and port conflicts fail safely without fallback or implicit data mutation. (AC-9, AC-13)
4. Applicable lint, typecheck, format, and wiring/build checks pass; unavailable roles are reported accurately.
5. Record files, verification evidence, and current status in the feature tracker; only /check marks completion.

## Verification Plan

- User builds/generates as documented, starts the API service, and requests /api/health directly on 9876 with the expected origin.
- Stop the development database while keeping API running; verify liveness succeeds and the separate diagnostic reports failure.
- Make one reversible host source change, observe reload and response, then restore only that verification edit.
- Check missing-client and occupied-port failures; inspect image/build inputs without exposing private values; confirm recovery retains the development sentinel.

### Tests

- API unit: this task · defaults select 9876 and the approved origin, configured overrides work, and invalid ports are rejected (AC-1, AC-13).
- API HTTP integration: this task · health/prefix/CORS remain correct after wiring and with database unavailable; reuse Task 03 characterization (AC-9).
- Web component: none · frontend runtime is Task 07.
- API database integration: none · reuse prior DB evidence; this task's new behavior is runtime wiring.

## Open Questions

- None; implementation findings that change a contract must return to /architect.

## Implementation Record

Not started.
