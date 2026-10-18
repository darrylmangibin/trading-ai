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

Not started.
