---
name: scope
description: "Run /scope <feature> (Codex: $scope) to define what a feature must do before any technical design. It settles the requirements with the user through questions that each carry a recommended answer, then writes .ai/feature-spec/<feature>/feature-overview.md (a mermaid workflow and AC-numbered success criteria) and progress-tracker.md. For a feature that already exists in code, it confirms the as-built behavior first and scopes only the change. /scope project revises .ai/project-overview.md. Writes no code."
argument-hint: "[project | feature name or one-line idea]"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /scope

Settle **what** the feature must do, from its users' and callers' side. `/architect` owns **how**; don't design the implementation here.

## Rules

- Write nothing until the user approves (Step 5). Never write application code.
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking). Never a neutral menu; never decide silently.
- Don't ask what `.ai/` or the code already answers: state it as an assumption the user can correct.
- Rule files are read-only. `/scope project` is the one mode that writes `.ai/project-overview.md`, because the user asked for it.

## Step 0: Identify the feature

- `project` → Project mode, below.
- A name or idea → a kebab-case folder name of up to 4 words, confirmed in the first round.
- No argument → list the modules in `.ai/project-overview.md` › Module map that have no folder in `.ai/feature-spec/`, and recommend the one the others depend on.
- The overview already exists → revise it. If `system-design.md` or tasks exist, warn that changed criteria mean re-running `/architect`.
- **Existing feature:** when the code already implements part of it, say so; the Existing-feature notes below apply.
- Read no other feature's spec; list folder names only.

## Step 1: Load

- `.ai/project-overview.md`, `.ai/architecture.md`, `.ai/project-progress-tracker.md` and `.ai/templates/feature-overview.md`.
- Existing code is evidence, not a requirement: search the area the feature touches (`.ai/folder-structure.md`). Treat anything inferred from the code, or from a ticket the user pastes, as a recommendation to confirm.
- Existing feature: read its entry points, behavior and tests well enough to describe what it does today, with `file:line` evidence, and note which behaviors have tests.

Open with 3–5 lines: the feature as you understand it, what you inferred and from where, and the main unknowns.

## Step 2: Brainstorm in rounds

Cover what isn't settled:

1. goal and consumers: which users, client apps or systems, and which roles;
2. the access boundary: who may see or change what, and the tenant boundary where `.ai/architecture.md` › Access defines one;
3. the core flow, step by step, including background work and its visible status;
4. what each user or caller may do at each step;
5. the information shown, accepted and kept;
6. the states a user sees: loading, empty, pending, in progress, completed, failed;
7. edge cases and failures as the user experiences them: duplicates, retries, partial failure, offline;
8. what is out of scope.

Existing feature: confirm the as-built behavior first (`Matches (Recommended)` or `Something is wrong`), then settle the change. Unclear as-built behavior is an open question, never a guess.

Infer what the docs and code answer, ask what only the user knows (business rules, roles, priorities, cuts), and recommend where best practice decides. After each round print **Agreed**, **Assumed** and **Open**.

## Step 3: Completeness check

Leave the brainstorm only when:

- every flow step names its actor, trigger, allowed callers, access boundary, and success and failure outcomes;
- everything shown or kept has an origin;
- every success criterion is observable and testable;
- every capability and every Workflow branch, failure branches included, maps to at least one success criterion (`/check <feature>` traces them);
- in and out of scope are agreed.

An unknown that changes the core flow → keep asking. Anything else → the tracker's Open Questions.

## Step 4: Draft in chat

Show the goal, the core flow, the scope, the success criteria `AC-1`, `AC-2`… and a mermaid `flowchart TD` of the core flow: the acting user or worker in each node, decision diamonds and failure branches. Quote labels that contain `()`, `:`, `/` or `,`. System and sequence diagrams belong to `/architect`.

Existing feature: tag each criterion `as-built` (current behavior to preserve) or `change` (new or different behavior). `/architect` plans work for the `change` criteria and protects the `as-built` ones the change touches.

## Step 5: Approval

Ask `Approve and write the overview (Recommended)` or `Revise`.

## Step 6: Write

In `.ai/feature-spec/<feature>/`:

- `feature-overview.md`: the sections of `.ai/templates/feature-overview.md`, titled with the feature name.
- `progress-tracker.md`: the headings of `.ai/templates/progress-tracker.md`; Current Phase `Scoped`; Next Up `/architect <feature>`; the Open Questions; at most 60 lines.

In `.ai/project-progress-tracker.md`, add the feature under Next Up.

## Project mode (`/scope project`)

Revises `.ai/project-overview.md`, the product definition every feature builds on, with the same rounds and approval gate. No feature files.

1. **Load** the current overview, `.ai/architecture.md` and the project tracker.
2. **Cover** the product goal and problem, the users and callers with their access boundaries, the module map and which module owns which workflow, scope and success criteria.
3. **Complete** when every module has a one-line intent and an owner of its data, and scope is agreed.
4. **Draft** in chat with a `flowchart TD` of the core cross-module flow, then the approval gate.
5. **Write** it, keeping its section headings; don't repeat `.ai/architecture.md` details.

## Report

```
## /scope <feature | project> · overview written
Wrote <files> (N success criteria: A as-built, C change | M modules).
Next: /architect <feature> | /scope <feature>
Heads up: <open questions>   (omit if none)
```

End with the next-step picker: `Run <the Next step for this outcome> now` · `Stop here`. Recommend running it when it continues the same task; recommend stopping, with a fresh context (Claude Code `/clear`, Codex `/new`), when it starts a new task, phase or feature: the task files and trackers hold the state.
