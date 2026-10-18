# Task 02: Frontend Test Infrastructure

## Source

- **Feature Overview**: `.ai/feature-spec/docker-prisma-foundation/feature-overview.md` (§ Features, Scope, Success Criteria)
- **System Design**: `.ai/feature-spec/docker-prisma-foundation/system-design.md` (§ Dependencies; Routes and Screens; Components and State; Public API and Compatibility; Test Strategy)
- **Rules**: `.ai/code-standards.md` (§ Commands, Testing, Definition of Done, Approved foundation verification extensions); `.ai/ai-workflow-rules.md` (§ Scope, Gates, Verification); owning area rules
- **Progress Tracker**: `.ai/feature-spec/docker-prisma-foundation/progress-tracker.md`

## Objective

The existing connection screen has deterministic Jest and React Testing Library coverage, with typed tests and honest suite results.

## Background

Depends on: none

This is a test-infrastructure task built by /test, not a standalone later test-writing task. It characterizes existing behavior before Task 07 changes web Docker wiring. Apply the React guidance to behavior and cleanup, without refactoring App.

## Scope

### In Scope

- Jest/JSDOM/Babel/RTL configuration, test typing, lint setup, package scripts, and first component cases.
- User-installed dependencies listed under System Design Dependencies; use exact pins and the existing workspace lockfile workflow.

### Out of Scope

- Application component changes, Vitest replacement in API, browser end-to-end tooling, Docker wiring, or weakening type/lint checks.

## What to Implement

### 1. Establish the component level

- Have the user install the complete Task 02 dependency set from the design. Never hand-edit the generated lockfile.
- User-run installation from the repository root:

```powershell
npm install --save-dev --save-exact --workspace @trading/web jest@30.5.2 jest-environment-jsdom@30.5.2 @jest/globals@30.5.2 babel-jest@30.5.2 @babel/core@8.0.7 @babel/preset-env@8.0.7 @babel/preset-react@8.0.1 @babel/preset-typescript@8.0.7 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.8
```

- Create `jest.config.cjs` with non-watch execution, explicit test discovery, JSDOM, CSS mapping, and an inline Babel transform isolated from Vite configuration.
- Use explicit `@jest/globals` imports and the jest-dom Jest-globals adapter. Add test setup and a separate TypeScript project referenced by web typecheck; exclude test-only files from the browser TS project.
- Fit CJS/test configuration into existing ESLint rules. Required empty suites must fail; do not set passWithNoTests.

### 2. Characterize the existing screen

- Cover checking and disabled retry; valid health JSON; non-OK response; malformed JSON; wrong/null response shape; network failure; and recovery through manual retry.
- Use fake time and abort-aware request doubles to prove the five-second boundary. A permanently pending double that ignores AbortSignal is insufficient.
- Cover unmount cancellation, cleanup of timers, obsolete responses, and StrictMode setup/cleanup. Assert observable state and cancellation effects, not implementation structure.
- Restore timers, requests, and DOM state between cases; no test contacts the running API.

## Files to Inspect

1. `apps/web/package.json`, `apps/web/src/App.tsx`, `apps/web/src/main.tsx`: runner entry and existing behavior.
2. `apps/web/jest.config.cjs` (new), `apps/web/src/test/setup.ts` (new), `apps/web/src/test/style-mock.cjs` (new): test setup.
3. `apps/web/src/App.test.tsx` (new): characterization cases.
4. `apps/web/tsconfig.test.json` (new), `apps/web/tsconfig.json`, `apps/web/tsconfig.app.json`, `apps/web/eslint.config.js`: typed/linted test scope.
5. `apps/web/README.md`: component test command and limitations.

## Contracts

Follow the cited System Design sections; do not duplicate or silently change their contract.

- **Data**: Transient React state and test-owned DOM/request/timer fixtures.
- **Inputs**: Controlled fetch results, user actions, time, and lifecycle events.
- **Outputs**: Existing visible statuses, retry availability, cancellation, and test results.
- **Validation**: Required suite discovery and strict test typing; source behavior stays unchanged.
- **Compatibility**: Existing App/StrictMode behavior and Vite build; API retains Vitest.

## Acceptance Criteria

1. Characterization proves existing checking/connected/unavailable, disabled pending retry, recovery, timeout, and cleanup behavior. (AC-10)
2. Jest/RTL cases cover successful, unsuccessful, malformed, network, timing, retry, unmount, and obsolete-response branches deterministically. (AC-11)
3. The web test command runs independently without services, fails when required tests are missing, and includes tests in typecheck. (AC-12)
4. Applicable lint, typecheck, format, and wiring/build checks pass; unavailable roles are reported accurately.
5. Record files, verification evidence, and current status in the feature tracker; only /check marks completion.

## Verification Plan

- None for product behavior: this task establishes component evidence. Run its non-watch suite, discovery, lint, typecheck, format, and web build; explicitly label the result as JSDOM rather than real-browser evidence.

### Tests

- API unit: none · test infrastructure.
- API HTTP integration: none · test infrastructure.
- Web component: this task · App renders checking/disabled retry, connected, unavailable for every response/error branch, recovers on retry, times out at five seconds, cancels on unmount, and ignores obsolete StrictMode requests (AC-10, AC-11); required suite discovery and typed setup (AC-12).
- API database integration: none · test infrastructure.

## Open Questions

- None; implementation findings that change a contract must return to /architect.

## Implementation Record

- **Status:** Completed by `/check docker-prisma-foundation 02` on 2026-10-18; PASS. Feature remains In Progress.
- **Authorization (2026-10-18):** user approved all 15 audit rows and the infrastructure file plan. After installation was found absent, the user's “can you fix it” authorized the agent to run the exact pinned installation and finish verification; this overrides the user-performed installation gate for Task 02 only.
- **Files:** added `apps/web/jest.config.cjs`, `apps/web/tsconfig.test.json`, `apps/web/src/test/setup.ts`, `apps/web/src/test/style-mock.cjs`, and `apps/web/src/App.test.tsx`; updated web dependencies/scripts, the generated root lockfile, TS references/exclusions, and README. Existing ESLint test/CJS rules needed no changes.
- **Setup:** explicit `@jest/globals` imports, jest-dom globals adapter, normal Jest runtime globals for RTL timer detection/automatic lifecycle hooks, inline Babel TSX transform, CSS stub, sequential non-watch script, and separate strict test TS project. React scheduling microtasks stay real while request deadlines use fake time. App and Vite source are unchanged.
- **Rules:** the already-approved conditional web command roles and component-level row in `.ai/areas/web.md` and `.ai/code-standards.md`, plus the foundation setup in `.ai/testing-guide.md`, are now active. No additional rule changes were needed.

### Test Files

- Web component: `apps/web/src/App.test.tsx` — 21 passing cases (17 connection cases, 4 StrictMode cases); 1 suite, JSDOM evidence only.
- Added 21 component tests; repaired 0 pre-existing tests. The new infrastructure was corrected during its first execution.
- API unit, API HTTP integration, API database integration: none assigned to this task.

### Coverage

Initial audit: 0 covered · 0 partial · 15 missing. Final re-audit: **15 covered · 0 partial · 0 missing**, comprising 13 component behavior rows and 2 infrastructure verification rows. No accepted gaps or implied extra scenarios.

- Web component · covered · AC-10/11 · checking/disabled retry: `apps/web/src/App.test.tsx` › `shows checking and prevents another request while the check is pending`.
- Web component · covered · AC-10/11 · valid JSON: `apps/web/src/App.test.tsx` › `shows connected for valid health JSON and clears the request deadline`.
- Web component · covered · AC-11 · non-OK response: `apps/web/src/App.test.tsx` › `shows unavailable for a non-OK response without reading its body`.
- Web component · covered · AC-11 · malformed JSON: `apps/web/src/App.test.tsx` › `shows unavailable when the response contains malformed JSON`.
- Web component · covered · AC-11 · wrong/null response shapes: `apps/web/src/App.test.tsx` › `shows unavailable for $name in the health response` (8 cases).
- Web component · covered · AC-11 · network rejection: `apps/web/src/App.test.tsx` › `shows unavailable when the network request fails`.
- Web component · covered · AC-10/11 · retry recovery: `apps/web/src/App.test.tsx` › `checks again after failure and removes the help when retry succeeds`; `can recover on a manual retry after a timeout`.
- Web component · covered · AC-11 · five-second boundary: `apps/web/src/App.test.tsx` › `keeps checking before five seconds and aborts at the deadline` (4,999 ms pending; 5,000 ms abort rejection/unavailable).
- Web component · covered · Tests/design · settled-request timer cleanup: `apps/web/src/App.test.tsx` › valid JSON and every unavailable case via `expectUnavailable`; advancing beyond completed deadlines leaves signals un-aborted.
- Web component · covered · AC-11 · unmount cancellation/cleanup: `apps/web/src/App.test.tsx` › `cancels a pending request and clears its deadline on unmount`.
- Web component · covered · AC-11 · obsolete success: `apps/web/src/App.test.tsx` › `keeps checking when an obsolete response body succeeds`; `keeps unavailable when an obsolete response body succeeds later`.
- Web component · covered · AC-11 · obsolete failure: `apps/web/src/App.test.tsx` › `keeps connected when an obsolete response body fails later`; cancelled StrictMode setup case.
- Web component · covered · AC-11 · StrictMode cleanup/deadline: `apps/web/src/App.test.tsx` › `ignores the cancelled setup request and keeps the active request until its own deadline`.
- Web setup · covered · AC-12 · required discovery/empty selection: `apps/web/jest.config.cjs` and package test script › listTests discovers only App.test.tsx; normal suite passes and unmatched selection exits 1, with no passWithNoTests.
- Web setup · covered · AC-12/Contracts · strict typing/build isolation: `apps/web/tsconfig.test.json`, app exclusions and root references › negative test-project probe rejects TS2322 and an unimported `expect` (TS2304); fixture removed, normal typecheck and Vite build pass.

### Verification

Commands from repository root on 2026-10-18. Use `fnm exec --using=24.17.0 --` because this harness's non-profile shell otherwise selects Node 23.7.0.

- `fnm exec --using=24.17.0 -- node --version` — PASS, v24.17.0.
- `fnm exec --using=24.17.0 -- npm.cmd install --save-dev --save-exact --workspace @trading/web jest@30.5.2 jest-environment-jsdom@30.5.2 @jest/globals@30.5.2 babel-jest@30.5.2 @babel/core@8.0.7 @babel/preset-env@8.0.7 @babel/preset-react@8.0.1 @babel/preset-typescript@8.0.7 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.8` — PASS, generated package/lock updates; 542 added, 3 removed, 10 changed. npm emitted peer/deprecation warnings and reported 19 moderate advisories across the dependency tree; no automatic upgrades or audit fixes applied. Existing package-version changes are Babel and its transitive helpers/lru-cache/semver; lockfile was not hand-edited.
- `fnm exec --using=24.17.0 -- npm.cmd ls --workspace @trading/web --depth=0` — PASS, all 12 direct test dependencies match the approved exact pins.
- `fnm exec --using=24.17.0 -- npm.cmd exec --workspace @trading/web -- eslint --max-warnings=0 --fix jest.config.cjs src/test/setup.ts src/test/style-mock.cjs src/App.test.tsx` — PASS after the setup repair; reviewed spacing fixes only.
- `fnm exec --using=24.17.0 -- npm.cmd exec --workspace @trading/web -- eslint --max-warnings=0 jest.config.cjs src/test/setup.ts src/test/style-mock.cjs src/App.test.tsx` — PASS, final read-only lint.
- `fnm exec --using=24.17.0 -- npm.cmd exec --workspace @trading/web -- jest --listTests` — PASS, exactly `apps/web/src/App.test.tsx` discovered.
- `fnm exec --using=24.17.0 -- npm.cmd run test --workspace @trading/web` — initial FAIL, 2 passed/19 failed (RTL fake-timer detection and React microtask counting); after setup repair PASS, 1 suite, 21 passed/0 failed, 1.325 s Jest time.
- `fnm exec --using=24.17.0 -- npm.cmd run test --workspace @trading/web -- --testPathPatterns=task02-no-tests-match` — expected exit 1, “No tests found”; negative discovery check PASS.
- `fnm exec --using=24.17.0 -- npm.cmd run typecheck --workspace @trading/web` — initial FAIL while dependencies were absent; PASS after install and again after setup repair/probe removal. Temporary `src/test/typecheck-probe.ts` deliberately produced TS2322 and TS2304 under this same command; both expected diagnostics verified and fixture removed in finally.
- `fnm exec --using=24.17.0 -- npm.cmd run format:check` — PASS, all matched files formatted.
- `fnm exec --using=24.17.0 -- npm.cmd run build --workspace @trading/web` — PASS, typed production build; Vite 8.3.4, 17 modules transformed.
- `git diff --check` — PASS for tracked changes.
- API unit/HTTP/database levels — n/a for this task, not reported as passing. No running API, database, browser or Docker evidence claimed. All verification processes finished; temporary type probe is absent.

### Fixes and Next Step

- Installed the missing dependency set after explicit delegation; earlier diagnosis found no recorded installation in retained npm logs.
- The first run confirmed that RTL's async wrapper checks the runtime `jest` global before advancing its own zero-delay timer. `injectGlobals: false` caused interaction timeouts. Restore normal runtime globals/RTL lifecycle registration while keeping explicit imported APIs and test-only TypeScript scope; the negative typing probe proves runtime globals do not grant implicit test types.
- React `act` schedules `queueMicrotask` jobs, which modern fake timers counted as pending timers. Keep that scheduler primitive real with `doNotFake: ["queueMicrotask"]`; the actual request timeout remains controlled at exactly five seconds. No assertion was removed/weakened and no retry or longer timeout was introduced.
- No application defect or design conflict found during implementation. Completion evidence is recorded below.

### Check

- **2026-10-18 · PASS → Completed** — Node 24.17.0; lint PASS (4 changed JS/TS test/config files), web typecheck PASS, check:format PASS, web build PASS (17 modules), related + recorded feature component tests PASS (1 file/suite, 21/21), required discovery PASS (1 file), empty-selection negative check PASS (expected exit 1); scenarios **15 covered · 0 partial · 0 missing · 0 accepted**. AC-10 ✓ (state/retry/timeout/cancellation cases), AC-11 ✓ (all response/error/lifecycle branches with controlled requests and time), AC-12 ✓ within Task 02's allocation (independent Jest suite, strict test project, discovery/failure propagation); task criteria 4 ✓ (quality/build checks) and 5 ✓ (records/tracker updated).
- **Preconditions and audit:** built/awaiting-check record present, no task dependencies. Read all 21 test bodies and their fixtures against the task, AC-10/11/12 and cited design. The 13 behavior rows are proved by the current passing `apps/web/src/App.test.tsx`; the 2 setup rows are proved by discovery/negative discovery, current typecheck/build, and the separate strict TS project. No missing, partial or accepted rows. Earlier Task 01 assigns no web component tests.
- **Consent and run order:** reused `.ai/ai-workflow-rules.md` › Verification's selected local-check authorization and the user's explicit `$check` request; no repeated approval. Commands ran sequentially, without fixes/watch/retries: lint → typecheck → format → build → related/feature union → negative discovery. Discovery ran first to resolve the exact test file. Every process completed.
- `fnm exec --using=24.17.0 -- npm.cmd exec --workspace @trading/web -- jest --listTests --findRelatedTests src/App.tsx src/App.test.tsx src/test/setup.ts src/test/style-mock.cjs jest.config.cjs` — PASS, only `apps/web/src/App.test.tsx` discovered.
- `fnm exec --using=24.17.0 -- npm.cmd exec --workspace @trading/web -- eslint --max-warnings=0 jest.config.cjs src/test/setup.ts src/test/style-mock.cjs src/App.test.tsx` — PASS, exit 0; no fixes.
- `fnm exec --using=24.17.0 -- npm.cmd run typecheck --workspace @trading/web` — PASS, exit 0; app, Vite and referenced test project included.
- `fnm exec --using=24.17.0 -- npm.cmd run format:check` — PASS, all matched files formatted.
- `fnm exec --using=24.17.0 -- npm.cmd run build --workspace @trading/web` — PASS, Vite 8.3.4, 17 modules transformed.
- `fnm exec --using=24.17.0 -- npm.cmd exec --workspace @trading/web -- jest --runInBand --findRelatedTests src/App.tsx src/App.test.tsx src/test/setup.ts src/test/style-mock.cjs jest.config.cjs` — PASS, 1 suite/file, 21 passed/0 failed, 15.769 s; related and recorded feature tests resolve to the same file and ran once.
- `fnm exec --using=24.17.0 -- npm.cmd run test --workspace @trading/web -- --testPathPatterns=task02-no-tests-match` — PASS for the negative contract: no tests found, expected exit 1, no passWithNoTests.
- **Requirement proof:** task criterion 1 → connection states, disabled retry, retry recovery, 4,999/5,000 ms boundary and cancellation assertions passed; criterion 2 → non-OK, malformed JSON, 8 invalid payloads, network rejection, unmount and obsolete success/failure/StrictMode assertions passed; criterion 3 → the service-free suite passed, empty selection failed correctly, and web typecheck included strict test-project references; criterion 4 → lint/types/format/build above passed; criterion 5 → Test Files/Coverage/verification retained and trackers updated by this check.
- **Scope and review:** read-only task review found no blocking defect or design conflict. No application/test/config/dependency edits, installs, external-service requests, private-file reads or Git writes during `/check`. API unit/HTTP/database and browser integration are n/a for this task, not passing evidence. JSDOM does not prove Docker/browser transport. The installation's previously recorded 19 moderate advisories were not an assigned audit gate; no dependency changes were made. Feature-wide review and remaining AC-12 allocations belong to their later tasks/final feature check.
- **Next:** stop with a fresh Codex `/new` context, then `/develop docker-prisma-foundation 03` (Prisma Database Access; Task 01 dependency satisfied).
