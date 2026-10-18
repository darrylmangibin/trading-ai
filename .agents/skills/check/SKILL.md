---
name: check
description: "The completion gate. /check <feature> <NN> (Codex: $check) verifies one task and marks it Completed: it reads the tests behind every scenario at every level its Tests block assigns (a covered / partial / missing matrix), then runs lint, typecheck and the tests .ai/code-standards.md says /check runs at each level. /check <feature> is the final review: every capability and workflow branch traced to an AC, every AC covered at its assigned levels, every task Completed, the full suites passing, the Definition of Done and a code review; then it marks the feature Completed. The only skill that marks work Completed. Never edits code or tests."
argument-hint: "<feature> [task number]"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /check

Nothing becomes Completed without evidence: a test that passed in this session, or an observation recorded from the running app. Reading the code, or reasoning that it should work, never counts.

## Rules

- Never edit application code or tests. Classify each failure and route it (Failure handling).
- Run tests only through the test-run consent: one prompt listing every command and its test files; the commands run one at a time. A skip means nothing is marked Completed, and the skip is recorded in the tracker.
- A timed-out or still-running process is not a pass.
- No external tools on your own initiative (`.ai/ai-workflow-rules.md` › Gates): evidence from a database, a deployment or an MCP server needs the user's explicit yes for that step; otherwise give the user the query to run.
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking).
- Coverage is judged from the test body (`.ai/code-standards.md` › Testing › Coverage), never from a test's name or the Coverage record alone.

## Mode

`/check <feature> <NN>` → Task mode. `/check <feature>` → Feature mode. No feature → `AGENTS.md` › Feature selection.

## Task mode

1. **Preconditions:** the tracker shows Task NN as `built, awaiting /check` (or `pre-kit`: built before the kit), its `Depends on` tasks are Completed, and its Implementation Record is filled. No `Tests` block, or a `pre-kit` task with no record → `/architect <feature>` (retrofit) first.
2. **Load** the task (acceptance criteria, `Tests` block, Implementation Record), the `AC-N` it serves, `.ai/code-standards.md` › Commands and Testing, and the `.ai/areas/` file of each area the task changed, if the repo has them (an area's tables override the repo-wide ones).
3. **Coverage matrix:** list every scenario of the task (`.ai/code-standards.md` › Testing › Coverage) at each level the block marks `this task`; a level that names another task is proven there. Resolve each row through the Coverage record to a file in the recorded Test Files and a describe block or test that exists in it, then read the test: `covered`, `partial` or `missing`. A row the Coverage record marks as accepted by the user stays accepted. A `partial` or `missing` row, or a required level with no test file, is a **missing test** → `/test <feature> NN`. Show the matrix, partial and missing rows first: # · scenario · source · level · status · the test or the gap. The task can't pass with such a row, but still run the list below so the report is complete.
4. **Build the run list,** so a regression the change caused elsewhere also blocks:
   - `lint` on the task's changed files (no fix: `/check` edits nothing), `typecheck` and every `check:` role; `build` when the record shows a change that needs it;
   - each level, as its row's `/check runs` column in `.ai/code-standards.md` › Testing › Levels says: `related` → `test:related` over the changed source files, plus the task's own test files; `feature` → the test files recorded by this task and the feature's earlier tasks; `suite` → the whole level.
   - A role or level whose command is `none` is reported as n/a, never as passed.
5. **Run** after the consent, one command at a time, in order: lint → typecheck → `check:` roles → build → each level; long suites in the background where the harness caps foreground commands. The prompt names every test file (resolve related ones with `test:list`). Any lint error in a changed file is a FAIL.
6. **Prove each requirement** with a `covered` test from step 3 that passed in this run. Where no automated level can prove it, cite running-app evidence per `.ai/ai-workflow-rules.md` › Verification (the exact request or action, the identity and environment, the observed result), or a read-only query the user runs. Ask before any step that writes data. A requirement with neither is unproven, unless the user explicitly accepts the gap (recorded).
7. **Verdict:** PASS only when lint, typecheck and every run pass, every matrix row is `covered` or accepted, and every requirement is proven or accepted. Otherwise FAIL, or BLOCKED when something couldn't run.
8. **Record:**
   - Task file › Implementation Record › Check: one line with the date, the verdict, the commands with pass counts, the scenario counts (covered · partial · missing · accepted), and the proof for each requirement.
   - Tracker on PASS: move Task NN to Completed, summarizing older ones as a range (`Tasks 01–04 completed`). On FAIL: keep it In Progress with the failing items. Either way, one verification bullet; at most 60 lines.
   - On PASS, then follow `.ai/ai-workflow-rules.md` › Gates › Git: commit only when it says to.

## Feature mode

1. **Preconditions:** every task is Completed with a latest Check line of PASS, or Skipped or `pre-kit` with the user's acceptance recorded in the tracker. Otherwise list the unfinished tasks and stop.
2. **Trace the requirements** in `feature-overview.md`, before running anything:
   - each Features capability and each Workflow branch (every decision outcome and failure branch in the flowchart) maps to at least one `AC-N`. An unmapped one is a **scope gap** → `/scope <feature>` (add a criterion, or move it out of scope), unless the user accepts it (recorded in the tracker);
   - each `AC-N` has a `system-design.md` › Test Strategy row, with a level or `none: reason`, and a task whose acceptance criteria cite it. An AC with no row or no owning task is a **design gap** → `/architect <feature>`.

   Show the trace as one table, gaps first: requirement (capability or branch) · `AC-N` · Test Strategy levels · owning task.
3. **Collect** the Test Files and Coverage records from every task's Implementation Record, by level.
4. **Run list, in order:** `lint` over the feature's changed files (no fix), `typecheck`, every `check:` role, `build`, then each level's full suite (`test:<level>` with no paths, or `test:all`); a `none` role is n/a. Recommend a 30- or 60-minute wait and run long suites in the background where the harness caps foreground commands; run the levels one after another, and keep going after a failure unless the build fails. A level the Test Strategy assigns with no working command is a missing test.
5. **Coverage matrix:** one row per `AC-N` and level the Test Strategy assigns, plus each task's recorded scenario rows: owning task · the test (`path` › name) · status. Resolve each through the owning task's Coverage record, confirm the test still exists and passed in this run, and read it: `covered`, `partial` or `missing` (`.ai/code-standards.md` › Testing › Coverage). A later task can delete or rewrite an earlier task's test, so rows proven at a task's check are re-verified here. Every collected file ran and passed; every task's latest Check proves its requirements. Show the matrix, partial and missing rows first, with accepted gaps listed. A `partial` or `missing` row is a missing test for the task that owns it.
6. **Definition of Done** (`.ai/code-standards.md`): lint, types, build and tests are proven by the runs. Verify each other item (API docs, migrations applied, observability…) from the code or the running app; ask the user to confirm what you can't verify, and record the answer.
7. **Code review**, as `.ai/ai-workflow-rules.md` › Verification sets it: required → a review of the feature's changes, or the user's explicit waiver, recorded; optional → offer it and record the choice. Claude Code: run `/code-review`. Codex: ask the user to run `/review` and share the findings, or do a read-only review pass (a reviewer subagent where available). Blocking findings fail the check and are routed like any failure; non-blocking ones go in the tracker.
8. **Verdict:** PASS requires step 2 with no open gap, steps 4–6 with every matrix row `covered` or accepted, and step 7 when the review is required. On PASS, set the feature tracker's Current Phase to `Completed` with one verification bullet, and in `.ai/project-progress-tracker.md` move the feature from In Progress to Completed. Keep both trackers at 60 lines or fewer, then follow `.ai/ai-workflow-rules.md` › Gates › Git. On FAIL, the phase stays In Progress: list the scope and design gaps, then the failures and partial or missing rows by level with the task that owns each, and route them.

## Failure handling

The `AC-N` and `system-design.md` decide what "correct" means.

| Class | Signal | Route |
| --- | --- | --- |
| Code bug | The code contradicts an AC or the design | `/fix <feature> NN` |
| Missing test | A scenario, a requirement, or a level the `Tests` block assigns has no test, or only a `partial` one | `/test <feature> NN` |
| Stale test | A test outside the task's files fails because the task changed that behavior on purpose | `/develop <feature> NN` |
| Test bug | The test contradicts the AC or design; its mocks, data or setup are wrong; or it needs something the test policy forbids | `/test <feature> NN` (repair) |
| Scope gap | A Features capability or Workflow branch maps to no `AC-N` | `/scope <feature>` |
| Design conflict | The AC or design is ambiguous; the code, test and design disagree; or an `AC-N` has no Test Strategy row or owning task | `/architect <feature>`, or `/scope` for product behavior |
| Environment | Tooling, or the local app needed for evidence, isn't installed, running or configured | BLOCKED: say what to start or configure |
| Flaky | It passes and fails on identical runs | `/test <feature> NN` (repair). It counts as a failure, never as a pass on retry |
| Pre-existing | Neither the failing test nor the code it exercises appears in this feature's Implementation Records | The user chooses: fix it in the task that owns it, or accept it. Acceptance is recorded and unblocks only this check |

- Re-run a test only to tell whether it's flaky or pre-existing, and only through the consent; never to turn a failure into a pass.
- Record each failure with its class and route in the Check line.
- Fix nothing yourself. End a FAIL with one question: `Start <route> for <first failure> now (Recommended)` or `I'll handle it later`.

## Report

Task mode:

```
## /check <feature> · Task NN · <PASS → Completed | FAIL | BLOCKED>
Lint ✓ · typecheck ✓ · scenarios 12 covered · 1 partial · 1 missing · 0 accepted · <level> 120/120 (<what ran>) · <level> 40/40 (suite) · AC-1 ✓ (test) · AC-2 ✓ (evidence) · AC-3 ✗

| # | Scenario | Source | Level | Status | Test or gap |   (every partial and missing row; omit when none)

Next: <the next task> · or /fix <feature> NN (code bug) · /test <feature> NN (test bug, partial or missing test)
Failures: <file › test: expected vs actual>   (omit if none)
```

Feature mode:

```
## /check <feature> · <PASS → feature Completed | FAIL>
Lint ✓ · typecheck ✓ · build ✓ · tasks N/N Completed · requirements traced N/N · <level> U/U · <level> I/I · AC coverage N/N · scenarios C covered · P partial · M missing · A accepted · DoD ✓ · code review ✓ (or waived)

| Requirement | AC-N | Levels | Owning task | Gap |   (every scope or design gap; omit when none)
| AC-N | Level | Owning task | Status | Test or gap |   (every partial and missing row; omit when none)

Next: <the next feature in the project tracker> · or the fixes below
Failures: <level · file › test · owning task>   (omit if none)
```

On PASS, end with the next-step picker: `Run <the Next step> now` · `Stop here`. Recommend running it when it continues the same task; recommend stopping, with a fresh context (Claude Code `/clear`, Codex `/new`), when it starts a new task, phase or feature: the task files and trackers hold the state. On FAIL or BLOCKED, the Failure handling question replaces it.
