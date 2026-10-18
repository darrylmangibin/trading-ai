# Task 07: Frontend Docker Workflow

## Source

- **Feature Overview**: `.ai/feature-spec/docker-prisma-foundation/feature-overview.md` (§ Features, Scope, Success Criteria)
- **System Design**: `.ai/feature-spec/docker-prisma-foundation/system-design.md` (§ Routes and Screens; Components and State; Public API and Compatibility; Resources and Rollout; Failure and Edge Cases; Test Strategy)
- **Rules**: `.ai/code-standards.md` (§ Commands, Testing, Definition of Done, Approved foundation verification extensions); `.ai/ai-workflow-rules.md` (§ Scope, Gates, Verification); owning area rules
- **Progress Tracker**: `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md`

## Objective

The developer can start the complete local environment, open the frontend on 6789, edit with reload, and run clearly separated sequential verification commands.

## Background

Depends on: Task 02, Task 04, Task 06

Frontend behavior was characterized in Task 02. This task completes Docker runtime wiring and operating instructions; it does not introduce a new screen. Use React guidance to preserve behavior and the existing Vite proxy.

## Scope

### In Scope

- Web Compose service, Vite port/host/proxy/polling, full startup/shutdown commands, and final local workflow documentation.
- Explicit sequential aggregate tests with nonzero failure propagation and separate database invocation.

### Out of Scope

- Application UI redesign, production deployment/preview changes, browser E2E framework, hosted Supabase, or unrelated dependencies.

## What to Implement

### 1. Wire the frontend to the Docker API

- Use frontend development port 6789 with strictPort. Inside Docker, listen on the container interface, enable Vite polling, and set API_PROXY_TARGET to http://api:9876; native development uses localhost:9876.
- Add the web service on the application network with source mounts and container-installed dependencies. Inject only nonsecret web configuration; no root/API private env file is mounted.
- Preserve App and its same-origin /api/health request. Source changes reload on the Windows host. Re-run characterization before and after wiring.

### 2. Complete commands and operating documentation

- Root docker:up runs compose up --build --wait --wait-timeout 120 for both apps and databases. docker:down runs compose down without removing volumes. The database test service stays behind its test profile.
- Root npm test explicitly runs API source unit tests, then API HTTP tests, then web component tests; remove --if-present and preserve failure exits. Do not run the mixed API suite and duplicate its HTTP portion.
- Keep root test:db separate. Document per-level commands, build/generation prerequisites, migrations, diagnostics, configuration/credential changes, partial startup, and safe recovery.
- Update root/web READMEs and local-development guide with the approved addresses and the limits of component/HTTP versus Docker/browser evidence.

## Files to Inspect

1. `apps/web/vite.config.ts`, `apps/web/.env.example`, `apps/web/package.json`: development port, proxy, polling, and scripts.
2. `compose.yaml`, `Dockerfile.dev`, `.dockerignore`: web service and safe shared runtime.
3. `package.json`: explicit aggregate and Docker lifecycle commands.
4. `apps/web/src/App.tsx`, `apps/web/src/App.test.tsx`: protected behavior and regression evidence; avoid source changes.
5. `README.md`, `apps/web/README.md`, `docs/local-development.md`: complete workflow and failure recovery.

## Contracts

Follow the cited System Design sections; do not duplicate or silently change their contract.

- **Data**: Existing transient UI state and development data owned by prior tasks.
- **Inputs**: Host edits, proxy target, approved addresses, lifecycle/test commands, and existing liveness responses.
- **Outputs**: Working local browser/API flow, reload, honest aggregate results, and complete developer instructions.
- **Validation**: Strict ports, correct service DNS, secret-free frontend inputs, required suite discovery and failure propagation.
- **Compatibility**: Existing UI states/timeout/retry/cancellation and API contract; database suite remains separate.

## Acceptance Criteria

1. Opening localhost:6789 reaches the API on 9876 through the same-origin proxy and exposes the existing connection behavior. (AC-1, AC-10)
2. Host source edits reload the frontend while development data survives normal workflow operations. (AC-3)
3. Aggregate checks enforce unit → HTTP → component ordering, fail for missing/failing required levels, and document the separate database suite. (AC-12)
4. Startup/retry handles missing setup, occupied ports, and partial service failure without silently changing ports or exposing server credentials. (AC-13)
5. Applicable lint, typecheck, format, and wiring/build checks pass; unavailable roles are reported accurately.
6. Record files, verification evidence, and current status in the feature tracker; only /check marks completion.

## Verification Plan

- Run the complete documented workflow after explicit user setup/generation. Open the browser at 6789, observe connected, stop API, observe unavailable, restart it, and use manual retry to recover.
- Make a reversible frontend host edit, observe reload, and restore only that edit. Confirm browser requests use /api and server-side proxy service DNS.
- Verify an occupied frontend port fails at 6789; inspect built browser inputs/configuration for absence of database credentials without printing secrets.
- Run required levels once in the defined order, then the separate DB suite. Use controlled temporary verification fixtures to establish aggregate failure propagation/missing-suite behavior; remove only those fixtures.
- Record local environment evidence, stop verification services with normal down, and retain all development storage.

### Tests

- API unit: this task · run the existing API source suite through the explicit first aggregate stage; no new API logic cases (AC-12).
- API HTTP integration: this task · run the existing HTTP suite as the second stage; no duplicate mixed API run (AC-12).
- Web component: this task · preserve Task 02 checking/result/error/timeout/retry/cleanup characterization through web wiring (AC-10); required web stage and discovery remain honest (AC-12).
- API database integration: none · root database suite remains independently required through Task 04; no new DB behavior.

## Open Questions

- None; implementation findings that change a contract must return to /architect.

## Implementation Record

Not started.
