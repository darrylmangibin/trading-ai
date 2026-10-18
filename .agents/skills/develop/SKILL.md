---
name: develop
description: "Run /develop <feature> [NN] (Codex: $develop) to build one task from .ai/feature-spec/<feature>/tasks/ as a senior engineer. Before building, it checks the task against the feature's requirements, system-design.md and the current code, settles the open questions the task depends on, raises its concerns and recommendations, and confirms a short plan with the user; then it builds the change to the .ai/ standards and the stack skills, updates the existing tests the change affects, runs lint and typecheck, and records the work in the task and the tracker. New tests are written by /test; only /check marks work Completed."
argument-hint: "<feature> [task number]"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /develop

Build exactly one task. You implement the decisions `/architect` made; you don't make new load-bearing ones.

## Rules

- One task per run.
- Never silently diverge from `system-design.md` or the task. If building it correctly needs a different design, stop and route to `/architect <feature>`.
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking).
- Never invent product behavior: ask with a recommended answer, or record the point in the tracker's Open Questions.
- The gates in `.ai/ai-workflow-rules.md` apply as written: dependencies, schema changes, protected files, external tools, git, verification and the test-run consent.
- `.ai/architecture.md` › Invariants are hard rules.
- Update the existing tests your change affects; don't write new ones (`/test` does).
- Rule files are read-only. If the task shows a rule is missing or stale, show the proposed wording (`file › section`) before the report and ask `Apply this wording now (Recommended)` · `Leave it for /sync-ai`; a yes authorizes that edit only.

## Step 0: Select

- **Feature:** per `AGENTS.md` › Feature selection. With no argument, list the feature folders that have `tasks/` and ask.
- **Task:** the number given, otherwise the first task the tracker shows as neither built nor completed. Confirm it.
- A test-infrastructure task (`none · test infrastructure` in its `Tests` block) → it is built by `/test <feature> NN`; stop.
- A legacy task with no `Tests` block → ask `Retrofit with /architect first (Recommended)` (so `/check` can verify it) or `Build it anyway` (it can't reach Completed until retrofitted; record that in the tracker).
- A `Depends on` task isn't completed → stop and name it, unless the user overrides.

## Step 1: Load

- The task, including its Open Questions; the `system-design.md` sections it cites, plus Decisions and the Test Strategy rows for its `AC-N`; from `feature-overview.md`, its `AC-N`, Scope, User Roles and Workflow; the tracker, including its Open Questions; the `.ai/code-standards.md` sections it touches, `.ai/folder-structure.md`, and the `.ai/areas/` file of each area it touches, if the repo has them.
- The stack skills `AGENTS.md` › Skills names for the code you'll write, before writing it.
- The files the task names and their neighbors in the owning module, to match their patterns. For a broad area, use a read-only subagent that returns a compact map: files to touch, patterns as `file:line`, helpers to reuse.

Then set the tracker: In Progress → Task NN; Current Phase → `In Progress` if it still says `Planned`.

## Step 2: Pre-build check

Settle each finding below before Step 3, one picker round at a time; quote both sides of a mismatch as `file › section`.

- **The task matches the requirements:**
  - each `AC-N` the task serves is fully realized by its acceptance criteria and What to Implement, and nothing in the task contradicts it;
  - its scope stays inside the overview's In Scope, respects Out of Scope and User Roles (who may do what), and handles the Workflow steps and failure branches it owns;
  - it agrees with the design's Decisions, contracts and Test Strategy row, and its `Tests` block plans a case for each of its acceptance criteria.

  Each mismatch → ask `Route to /architect to correct the task (Recommended)` · `Build as written and record the gap` (in the tracker's Open Questions; `/check` will flag it) · or route to `/scope` when the requirement itself is wrong. Never settle product behavior here.
- **Open questions:** read the task's and the tracker's Open Questions. Each one this task depends on (it decides a value, a contract, access, an error path or an `AC-N`) → ask it with a recommended answer before planning. Record a local answer in the task's Open Questions (resolved, with the date); an answer that changes the design, a contract or an `AC-N` goes through `/architect` (product behavior through `/scope`) before building. List the questions this task doesn't depend on in the plan as not blocking.
- **The design matches the code:** the models, entry points, contracts and modules this task relies on exist as `system-design.md` describes. A mismatch → stop and route to `/architect`, or to the earlier task.
- **Every value is sourced** in the design's Value Sourcing or in the task. An unsourced value that is load-bearing (the data model, a contract, access rules, async payloads, behavior an `AC-N` constrains) → ask with a recommendation, and record the answer through `/architect` before building. A local detail (a name, a helper's shape, file placement) → decide it and mention it in the report.
- **Gates ahead:** a new package → stop now, name it and why, and ask the user to install it. A schema change → plan to stop right after drafting it.
- **Concerns and recommendations:** review the task as a senior engineer before building it: risks (access and isolation, data integrity, concurrency, performance, security, the loading, empty and error states), edge cases the task misses, a simpler or more consistent approach, existing code to reuse, and tests the change will break. Each one: the concern, your recommendation and its reason. None → say so.

## Step 3: Plan

Show the files to create (marked `(new)`) or edit, the approach for each, the existing tests the change affects, the gates ahead, the non-blocking open questions, and the concerns and recommendations from Step 2. Then ask, in one round:

- when there are recommendations: which to adopt (`multiSelect`, each labeled with its reason; your picks marked `(Recommended)`). A recommendation that changes the design, a contract or an `AC-N` routes to `/architect` instead of into the build. Adopted ones join the plan; declined ones go in the report;
- `Proceed (Recommended)` or `Adjust`.

## Step 4: Build

- **Schema:** draft the one new migration the design calls for, in the style of the existing ones, then apply it and run `codegen` exactly as `.ai/ai-workflow-rules.md` › Gates › Schema changes says, stopping for the user where it says so; resume once the schema is in place. Never edit an existing migration or hand-edit generated files.
- **Standards:** apply every `.ai/code-standards.md` section the change touches (layering, contracts and validation, data access, access control, async work, errors and logging, UI states…). Where the standards defer to the owning module's existing style, match it.
- **Secrets:** read them from configuration; name each new env var in the report.
- **Replaced code:** delete it and update its references. A reference outside this task's scope → stop and ask.
- **Existing tests:** update every test the change affects: payloads, fixtures, mocked call arguments, expected results and errors.

## Step 5: Verify

1. `lint:fix` on the files this task changed (mandatory; fix every error), then review what it changed. Never a repo-wide lint that rewrites untouched files.
2. `typecheck` and every `check:` role; also `build` when `.ai/code-standards.md` › Commands says this kind of change needs it. A `none` role is n/a.
3. Run the affected existing tests, only through the test-run consent.
4. Mark each acceptance criterion met, or not met with the reason.

## Step 6: Record

- **Task file › Implementation Record:** Source Files lists every file created, updated or removed; Existing Tests Updated lists each test file changed, with the reason. One line each.
- The task is **built** when the code is in, lint and typecheck pass, and the affected tests are updated. Only `/check` marks it Completed.
- **Tracker:** In Progress `Task NN: built, awaiting /check`, or what still remains; Next Up `/test <feature> NN` when any `Tests` level says `this task`, then `/check <feature> NN`; one verification bullet; new decisions and open questions. At most 60 lines.

## Report

```
## /develop <feature> · Task NN · <built | in progress | blocked>
**<one line: what landed>.** Lint ✓ · typecheck ✓ · affected tests <updated | none> · N files recorded.
Next: /test <feature> NN, then /check <feature> NN   (straight to /check when every Tests level says none)
Heads up: <gaps built as written · declined recommendations · new env vars · migration pending · open questions · local decisions · proposed rule changes>   (omit if none)
```

End with the next-step picker: `Run <the Next step for this outcome> now` · `Stop here`. Recommend running it when it continues the same task; recommend stopping, with a fresh context (Claude Code `/clear`, Codex `/new`), when it starts a new task, phase or feature: the task files and trackers hold the state.
