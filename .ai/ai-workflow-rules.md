# AI Workflow Rules

The kit workflows apply these project rules. The user’s current instructions and existing authorization remain authoritative.

## Sources of truth

- Use `FOREX_AI_PRD.md` for detailed product intent, `.ai/project-overview.md` for its concise overview, code for implemented behavior and feature specifications for an approved change.
- Never invent trading settings, provider capabilities, confidence probabilities, authorization exceptions, implemented modules or verification evidence.
- Before changing code, identify the feature, owning application/module, state owner and access boundary.
- Preserve the API and web area's existing patterns; do not standardize them by introducing unrelated replacements.

## Rule files are read-only

`AGENTS.md`, `CLAUDE.md`, the canonical kit skills and `.ai/` rules are user-managed. Edit them only when the user asks or approves a proposed rule change. The kit workflows may update their assigned feature files and progress records. Put feature implementation design in its `system-design.md`.

## Asking

- Every question, choice, approval and confirmation opens the harness's question tool (Claude Code `AskUserQuestion`, Codex `request_user_input`): open questions, feature and task selection, plan approvals, each fixed prompt a skill names (`Proceed (Recommended)` · `Adjust`), the test-run consent, a FAIL's next step and the next-step picker that ends a skill. Never ask in plain chat text while the tool is available, and never end a turn on a question the tool could have asked.
- Up to 4 questions a round, 2–4 options each (Codex's `request_user_input`: up to 3 questions, 2–3 options; put any other option in the question text). Give each question a short header.
- Every option has a short label and a one-line description of what happens if it's chosen: what runs, changes, gets recorded or is skipped. Your pick goes first, marked `(Recommended)`, and its description includes the reason. The user can always answer in their own words. Never a neutral menu; never decide silently.
- Claude Code: put a table, plan, diff or coverage matrix the user judges in an option's `preview` (single-select only); use `multiSelect` when the user picks several items (findings to apply, gaps to fill).
- Without a question tool, ask in chat as numbered questions with lettered options, then stop and wait.
- Don't ask what `.ai/`, the code or the conversation already answers: state it as an assumption the user can correct.

- Reuse authorization already supplied for the current task. Do not ask the same settled decision again.
- Keep a choice pending when an answer is required. A preselected option, missing answer or elapsed time is not approval.
- Use an approval-capable question tool when the current harness restricts its general question tool to optional preferences.

## Scope

- Work on one named feature and one task at a time in the kit workflows. Ordinary questions and small changes do not require a feature ceremony.
- Keep cleanup inside the current task's necessary scope.
- Split unrelated application, worker, data-store or refactoring changes into separate tasks.
- Change a behavior with its contract, affected tests and applicable documentation.
- Record narrow, reversible assumptions. Ask about behavior, cost or risk that the source material does not settle; continue only with independent work while an answer is pending.

## Gates

- **Dependencies:** Name each new, upgraded or removed package and its reason; the user performs dependency changes. Reuse installation authorization explicitly supplied in a later user request rather than asking the same authorization again.
- **Schema changes:** The agent drafts the new migration; the user applies it and performs any required generated-client step. No migration or ORM tool is configured yet; an introducing feature must define the layout and real commands. Preserve existing migrations and generated clients.
- **Protected files:** private environment files, credentials, lockfiles, generated output, tool configuration and future existing migrations change only within an authorized task. Do not revert user changes or hand-edit generated artifacts.
- **Secrets:** never open private environment files, keys or credential files; inspect example variable names only. The user supplies secrets through the environment.
- **External tools and MCP:** use only the steps the user has authorized. For an unrequested shared-service query or mutation, present the exact operation and ask first. Reuse existing task authorization rather than asking again for the same step.
- **Git:** no repository exists yet. Do not initialize, commit, push, rebase or rewrite history unless the user asks; do not invent a commit style.
- **Kit installation:** preserve upstream workflow skill contents and the required Asking wording. Verify kit structure without running application tests, builds, installers, migrations, formatters or linters.

## Verification

- Apply the relevant lint, type and format roles, plus build for changes named in the Commands table. Review targeted lint fixes before recording a result.
- Update affected existing tests with the behavior they prove.
- **Test-run consent:** The agent runs local repository checks without asking again and reports the commands and results. A timed-out or still-running process is not a pass. This selected policy governs generic test-prompt wording in the kit skills.
- Run one test process at a time, levels in the defined order, without watch or retry processes. A timeout or running process is not a pass.
- **Running-app evidence:** use the run role and record the exact request/UI action, local identity/environment and observed outcome; stop verification processes afterward. No real provider credentials are needed for the current liveness check.
- Only the check workflow marks a task or feature Completed from current evidence or an explicitly recorded acceptance.
- A completed feature requires a code review or the owner's recorded waiver.

## Test strategy

- Use local deterministic tests and in-process owned HTTP; keep external services simulated or mocked under the current test policy.
- Each task carries its own tests; separate test-infrastructure tasks establish missing levels.
- Low risk: test actual logic; avoid tests that copy a trivial presentation change.
- Medium risk: cover rules and the changed HTTP or UI entry point at an appropriate configured level.
- High risk: approvals, ownership, risk arithmetic, schema, async execution and reconciliation need all applicable levels and an architecture cross-check within authorized resources.
- A missing test level is an infrastructure requirement, not evidence that the feature is complete.

## Progress trackers

- Update a feature tracker when a task starts, after meaningful changes and when it ends.
- Record current state in bullets of at most two lines; replace stale entries and keep the tracker within 60 lines.
- Keep feature-only status in `.ai/project-progress-tracker.md`; keep task details, decisions and verification in the feature's own tracker.
- The existing application foundation is pre-kit code, not a completed product feature or a completed PRD release phase.
