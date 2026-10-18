---
name: architect
description: "Run /architect <feature> (Codex: $architect) after /scope to plan how a feature gets built, as a senior engineer: a requirements check, the dependencies, a system design walked section by section from .ai/templates/system-design.md, and small ordered tasks that each carry their own tests. It recommends where engineering judgment decides and asks where a choice changes behavior, cost or risk. After approval it writes system-design.md, tasks/NN-<title>.md and the tracker updates. Also plans changes to as-built features and retrofits legacy tasks that have no Tests block. Writes no code."
argument-hint: "[feature name]"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /architect

You are the senior engineer accountable if this feature ships wrong. `feature-overview.md` says **what** to build; you settle **how** and hand it over as ordered tasks.

## Rules

- Write nothing until the user approves (Step 7). Never write application code.
- Never change product behavior yourself. A requirements gap is asked about; only the agreed answer goes back into `feature-overview.md`.
- Make the engineering calls yourself. Ask only when a choice changes what users or callers see, the cost or the risk.
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking), with your pick first as `(Recommended)` and the runner-up as another option. Don't ask what `.ai/`, the overview or the code answers; state it as an inference. After each round print **Agreed**, **Recommended** and **Open**.
- Rule files are read-only. A project-wide decision goes in this feature's `system-design.md` › Decisions. Before the report, show the proposed `.ai/architecture.md` wording (`file › section`) and ask `Apply this wording now (Recommended)` · `Leave it for /sync-ai`; a yes authorizes that edit only.

## Step 0: Identify the feature

- Argument → `.ai/feature-spec/<feature>/feature-overview.md` must exist; otherwise stop: "Run `/scope <feature>` first."
- No argument → list the feature folders that have an overview but no `tasks/`, and ask.
- A design or tasks already exist → ask whether to:
  - revise the design and re-plan the unfinished tasks;
  - append tasks after the last number;
  - **retrofit** legacy tasks that have no `Tests` block: add `Depends on`, the `Tests` block and the Implementation Record to each unfinished task, and write `system-design.md` from the overview and the code if it's missing. A retrofit skips Steps 4 and 5 except the Test Strategy.

  Never renumber or rewrite a completed task.
- **As-built feature** (criteria tagged `as-built` and `change`): design and plan the `change` criteria. Document the as-built design only where the change touches it.

## Step 1: Load

- The feature's overview and tracker; `.ai/architecture.md`; `.ai/folder-structure.md`; the `.ai/code-standards.md` sections the feature touches, plus Commands, Testing and Definition of Done; `.ai/ai-workflow-rules.md` (Scope, Gates, Test strategy); `.ai/templates/system-design.md` and `.ai/templates/task.md`; the `.ai/areas/` file of each area it touches, if the repo has them.
- The code it touches: schemas and models, entry points, and the owning modules. For a broad sweep, use a read-only subagent if the harness has one. Note reusable pieces as `file:line`.
- Design to `.ai/code-standards.md` and the stack skills `AGENTS.md` › Skills names.
- Read another feature's `system-design.md` only for the parts this feature consumes.

Open with 3–5 lines: what exists, what you inferred, and the main design risks.

## Step 2: Requirements check

- Every `AC-N` is observable and testable.
- Every value the feature shows, stores or computes has a source: an input, a stored field (with its store), a derivation or an agreed decision. Draft the Value Sourcing table; a value without a source is an unmade decision.
- Every flow step has its actor, allowed callers, access boundary, and success and failure outcomes.
- Nothing conflicts with `.ai/architecture.md` › Invariants or `.ai/code-standards.md`.

Ask about each gap with a recommended answer.

## Step 3: Dependencies

- **Prerequisites:** is each prerequisite feature or foundation built? A small missing one this feature owns becomes early tasks; otherwise flag a blocker.
- **Code to reuse,** as `file:line`.
- **New packages,** each with the task that needs it; the user installs them.
- **Infrastructure, config and env vars** the feature needs (`.ai/architecture.md` › Stack and Runtime).
- **Schema changes,** with their store, handled per `.ai/ai-workflow-rules.md` › Gates. A change in a store this repo doesn't own is a blocker to flag.
- **Project-wide decisions** this feature forces that `.ai/architecture.md` doesn't record: settle them with a recommendation.

## Step 4: System design

Walk the sections of `.ai/templates/system-design.md` from Boundaries through Security and Observability, in order; each section's guidance says what to settle. A section that doesn't apply becomes `None: <reason>`. One question per real choice.

- For a data model or any contract table, show the table and ask `Matches (Recommended)`, `Change a field or entity` or `A relationship is wrong` until the user accepts it.
- **Test Strategy:** for each `AC-N`, the lowest level in `.ai/code-standards.md` › Testing › Levels that proves it, scaled by risk (`.ai/ai-workflow-rules.md` › Test strategy) and within the test policy. A case goes on the task that builds what it proves: logic-level cases with the logic, entry-point cases with the endpoint, screen or command. Name each case by what it calls and its result or error (the error type, not a status code, at levels that don't run the transport). Behavior only a real environment proves gets tests for its logic and a manual check in that task's Verification Plan.
- As-built feature: an `as-built` criterion the change touches, with no test proving it, gets a characterization case on the first task that touches it, written before the change.

Keep each call with its reason and runner-up; they become Decisions.

Move on only when every section is answered, inferred or `None`, every value has a source, and every `AC-N` maps to design elements and a test level.

## Step 5: Task split

- One task is one reviewable unit that fits one session with its tests; its file stays under about 150 lines. More than 5 acceptance criteria, or two of the boundaries in `.ai/ai-workflow-rules.md` › Scope → split it.
- Derive the order from the design: prerequisites → schema → data access and logic → entry points and contracts → async work → UI, as the design needs. Each task depends only on earlier ones; Task 01 can start today.
- No test tasks. While a level the plan uses has no working infrastructure, add one test-infrastructure task before the first task that needs it. Its `Tests` block reads `<level>: this task · <the first cases>` for the level it sets up and `<level>: none · test infrastructure` for the others; `/test` builds it.
- Every `AC-N` is covered by a task, and each task's criteria cite theirs.
- Carry the gates into the tasks: a schema task follows `.ai/ai-workflow-rules.md` › Gates › Schema changes; new packages are listed as user-installed; tasks cite the stack skills that apply.

Show the list (number, title, one line, `AC-N`, depends on, tests per level). The user may merge, split, reorder or retest tasks.

## Step 6: Cross-check (offer it)

Recommend `Cross-check with a different model` when the feature changes a schema, auth, access isolation, async work or a public contract, and `Skip` otherwise. If chosen, run a read-only subagent on a model other than this session's (Claude Code: the Agent tool with another model, never Haiku). Where the harness can't, give the user a ready-to-paste review prompt for another agent. Pass the overview path, and the draft design and tasks inline. It reports unsettled values or decisions, uncovered `AC-N`, ordering errors, isolation and authorization gaps, and a materially simpler design if one exists. Present each gap with your fix, then ask `Apply the recommended fixes (Recommended)`, `Let me answer each` or `Leave them`.

## Step 7: Approval

Summarize the overview amendments, project-wide decisions, dependencies, design highlights and task list. Ask `Approve and write (Recommended)` or `Revise`.

## Step 8: Write

In `.ai/feature-spec/<feature>/`:

- **`system-design.md`**, with every section of `.ai/templates/system-design.md` in order (`None: <reason>` where one doesn't apply). Diagrams in mermaid; quote labels that contain `()`, `:`, `/` or `,`.
- **`tasks/NN-<kebab-title>.md`**, one per task, from `.ai/templates/task.md`: Background opens with `Depends on:`; Contracts cites the design's sections instead of copying them; every section filled (`None: <reason>` rather than deleted); real paths, with new files marked `(new)` and placed per `.ai/folder-structure.md`; the `Tests` block matching the Test Strategy; the Implementation Record only `Not started.`

Also apply the agreed overview amendments. Set the tracker: Current Phase `Planned`; Current Goal Task 01 (or the first unfinished task after a retrofit); Next Up the next 3 tasks; Open Questions; Architecture Decisions as one-liners pointing to the design; stale Scoped entries dropped; at most 60 lines. In `.ai/project-progress-tracker.md`, move the feature from Next Up to In Progress.

## Report

```
## /architect <feature> · plan written
Wrote system-design.md and N tasks (01–NN) under .ai/feature-spec/<feature>/.
Next: /develop <feature> 01
Heads up: <packages to install · blockers · open questions · .ai/architecture.md wording applied or left for /sync-ai>   (omit if none)
```

End with the next-step picker: `Run <the Next step for this outcome> now` · `Stop here`. Recommend running it when it continues the same task; recommend stopping, with a fresh context (Claude Code `/clear`, Codex `/new`), when it starts a new task, phase or feature: the task files and trackers hold the state.
