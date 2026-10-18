---
name: test
description: "Run /test <feature> [NN] (Codex: $test) to audit every scenario a task must prove, show a covered / partial / missing matrix, then write, repair and run the tests its Tests block assigns, at the levels and under the test policy in .ai/code-standards.md, following .ai/testing-guide.md. It also builds test-infrastructure tasks and repairs failing or flaky tests that /check routed here. Changes tests, fixtures and approved test setup only; application bugs go to /fix."
argument-hint: "<feature> [task number]"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /test

Prove the task's requirements with tests a reviewer can trust: each case maps to a requirement, fails for the right reason, and runs deterministically under the repo's test policy.

## Rules

- Change tests, fixtures, mocks and approved test setup only. An application bug → report the failing case with expected and actual behavior, and route it to `/fix`.
- Never weaken, skip or delete a failing test to get a pass without the user's agreement.
- The test policy in `.ai/code-standards.md` › Testing is absolute: no test reaches what its level doesn't allow.
- Shared test infrastructure (configs, setup files, global helpers) changes only after the user approves the proposed files; an approved test-infrastructure task covers its own scope. Missing packages follow the dependency gate.
- Run tests only through the test-run consent (`.ai/ai-workflow-rules.md` › Verification).
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking).
- Only `/check` marks tasks or features Completed.

## Step 0: Select

- **Feature** per `AGENTS.md` › Feature selection; the task given, or the tracker's built task awaiting tests. Confirm it only when the choice is ambiguous.
- **Planned coverage:** the task must be built (a test-infrastructure task needs only its dependencies built). Every level in its `Tests` block is `none` → report that and point to `/check`. No `Tests` block → `/architect <feature>` (retrofit).
- **Repair** (a failing or flaky test from `/check` or the user): the failure and its requirements set the scope; a missing legacy `Tests` block doesn't block a repair.

## Step 1: Load

- The task's acceptance criteria, `Tests` block and Implementation Record; the `AC-N` it serves; the design sections it cites; the tracker.
- `.ai/code-standards.md` › Testing and Commands, `.ai/testing-guide.md`, `.ai/folder-structure.md` › Tests, and the `.ai/areas/` file of each area the tests touch, if the repo has them (an area's tables override the repo-wide ones).
- The source under test, its existing tests and fixtures. For higher levels, also the module wiring, injected collaborators, request or render context, and the access and data boundaries.

## Step 2: Audit

Build the coverage matrix before writing anything, as `.ai/code-standards.md` › Testing › Coverage defines it. A repair audits only the failing test's requirements.

1. **List the scenarios** from that section's sources. A scenario the task implies but its `Tests` block doesn't plan (a Contracts error state, a cited edge case) is marked `implied`: it may belong to another task, so it's written only with the user's agreement.
2. **Find and read the tests** for each scenario at each assigned level: the Coverage record, the subject's existing specs, and specs that drive the same entry point. Judge `covered`, `partial` or `missing` from the test body; only a test at a level proves that level.
3. **Show the matrix** as one table, missing and partial rows first: # · scenario · source (`AC-N`, Tests block, Contracts, design, `implied`) · level · status · the test (`path` › name) or the gap · planned edit. A partial row says what it lacks (e.g. "asserts the call, not the payload"; "no error case"). Close with `Scenarios: C covered · P partial · M missing`.
4. Every row covered → say so and go to Step 4 to run them. Otherwise ask `Write every missing and partial test (Recommended)` · `Let me pick the rows` (then a `multiSelect` of the rows) · `Change the plan`. A row the user leaves out is an accepted gap, recorded in Step 5.

A test-infrastructure task: show the files you'll add or change and get approval before writing.

## Step 3: Write

- Extend the subject's existing spec; place new specs per `.ai/folder-structure.md` › Tests and `.ai/testing-guide.md`.
- Follow the guide's setup and mocking recipes. Reuse the module's fixtures and builders before adding new ones; a fixture moves to the shared fixtures location once a second spec needs it.
- Name tests after behavior, never with an `AC-N`.
- A changed requirement can make an assertion stale: update it only against the documented or user-confirmed contract. If the assertion is right and the code is wrong, route to `/fix`.
- Repair flakiness at its cause (isolation, resets, a frozen clock, seeded data), never with sleeps, retries or longer timeouts.
- Ask about any behavior or scope the requirements don't settle.

## Step 4: Verify

1. `lint:fix` on every changed test and helper file, then review what it changed; `typecheck` when the test files are part of the typed project.
2. Through the consent: list the new and affected test files (`test:list` where it helps) and run them with each level's command: one process at a time, levels in order, no watch or retry.
3. Read the complete results, even when a suite fails. A compile failure, timeout or still-running process is a failure or unverified, never a pass.
4. Fix wrong mocks, fixtures or setup within scope and re-run under the same consent. A test that needs real credentials or a live service is missing a mock: fix the mock; never supply credentials or loosen a guard.
5. Route application bugs to `/fix` and design conflicts to `/architect`. Record unrelated failures without claiming a full pass.
6. **Re-audit** the Step 2 matrix against the tests as written and run: each row is now `covered`, or stays `partial` or `missing` with its reason (an application bug routed to `/fix`, a row the user left out, a design question routed to `/architect`).

## Step 5: Record

- **Implementation Record:** Test Files (path and test count per level); Coverage, one line per covered scenario and level (`path` › describe block or test name), and one per remaining partial or missing row (what's uncovered; accepted by the user, or routed where); repairs under Fixes; one line with the exact command, date and result.
- A test-infrastructure task: propose the `.ai/code-standards.md` › Commands and › Testing › Levels rows and the `.ai/testing-guide.md` sections it settled, and apply them once the user approves, so `/check` can run the new level.
- **Tracker:** passing tests with every row covered or accepted leave the task `built, awaiting /check`; a remaining gap keeps `/test <feature> NN` in Next Up with the gap; an application failure puts `/fix` first. At most 60 lines.

## Report

```
## /test <feature> · Task NN · <all covered | gaps remain | failures routed | blocked>
**Added N, repaired M at <levels>.** Scenarios: C covered · P partial · M missing · <command>: P passed, F failed

| # | Scenario | Source | Level | Status | Test or gap |   (every partial and missing row; omit when none)

Next: /check <feature> NN · or /test <feature> NN (gaps remain) · /fix <feature> NN (application bug)
Heads up: <accepted gaps · files that couldn't run · infrastructure changes · rule rows proposed or applied>   (omit if none)
```

End with the next-step picker: `Run <the Next step for this outcome> now` · `Stop here`. Recommend running it when it continues the same task; recommend stopping, with a fresh context (Claude Code `/clear`, Codex `/new`), when it starts a new task, phase or feature: the task files and trackers hold the state.
