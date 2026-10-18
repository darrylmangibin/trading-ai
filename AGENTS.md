# Repository Agent Instructions

The `.ai/` files are this repository's rules. Use the PRD for product intent and the code for implemented behavior; never invent product capabilities.

## Read first

| File | For |
| --- | --- |
| `.ai/project-overview.md` | Product scope, vocabulary, module map and open decisions |
| `.ai/architecture.md` | Stack, runtime, execution flow, boundaries and invariants |
| `.ai/folder-structure.md` | File placement and naming |
| `.ai/code-standards.md` | Conventions, command roles, testing and Definition of Done |
| `.ai/testing-guide.md` | Test setup and evidence by level |
| `.ai/ai-workflow-rules.md` | Asking, authorization, gates, verification and trackers |
| `.ai/areas/api.md` | Rules for `apps/api` |
| `.ai/areas/web.md` | Rules for `apps/web` |

Feature work also reads its `.ai/feature-spec/<feature>/` overview, design, tasks and tracker. List other feature folders rather than reading unrelated specifications. Setup decisions and link repair commands are in `.ai/kit.md`; feature status is in `.ai/project-progress-tracker.md`.

## Rule files are read-only

`AGENTS.md`, `CLAUDE.md`, the kit skills and `.ai/` rule files are user-managed. Edit them only when the user asks or approves a proposed change. The kit workflows update their assigned feature files and progress records.

## Workflow

`/scope <feature>` → `/architect <feature>` → per task `/develop <feature> NN` → `/test <feature> NN` → `/check <feature> NN` → finally `/check <feature>`.

- In Codex, invoke skills as `$name`; the kit documents them as `/name`.
- Only the check workflow marks work Completed. Route code defects to fix, test defects/gaps to test and design conflicts to architect.
- Scope project revises the product overview; sync-ai updates approved rules as code and tooling change.
- Use a fresh context between tasks; feature files and trackers carry the state.

## Skills

- Canonical workflow skills live in `.agents/skills/`. Claude Code reads the same files through per-skill Windows junctions in `.claude/skills/`; edit only the canonical copy. Repair commands are in `.ai/kit.md`.
- No project-local stack skills are copied; existing personal/plugin skills remain outside this kit.
- Project rules and the owning area's patterns take precedence over skill defaults. A skill does not authorize an unrelated dependency or external action.

## Feature selection

Kit workflows use one named feature. If the conversation has not identified one, list the feature folders and ask which to use. Reuse a feature already named in the current task. Ordinary questions and small changes outside the kit workflow do not require feature selection.

## Guardrails

- Make the smallest coherent change inside the authorized task.
- Preserve ownership, immutable approval, environment separation, deterministic domain boundaries and durable reconciliation (`.ai/architecture.md` under Invariants).
- Use the local deterministic test policy and selected execution consent; do not treat absent web tests as passing.
- Preserve generated artifacts, existing migrations and unrelated user changes; follow the protected-file gate.
- Never open private environment files, keys or credential files, or print secrets.
- Apply `.ai/ai-workflow-rules.md` under Gates before dependencies, migrations, external tools or shared-service actions; reuse existing authorization.
- Never initialize Git, commit, push or rewrite history unless asked.
- Every question and approval opens the harness's question tool (Claude Code `AskUserQuestion`, Codex `request_user_input`): recommended option first, every option saying what happens if it's chosen (`.ai/ai-workflow-rules.md` › Asking).
- Ask about unresolved behavior, or record it in the feature's Open Questions and continue only with independent work.

<!-- postman-cli:installation:start -->
Postman CLI is installed on this device, and can be used for API Engineering work.
<!-- postman-cli:installation:end -->
