---
name: fix
description: "Run /fix <feature> [NN], or /fix with a bug description (Codex: $fix), to find and fix the root cause of a failure /check reported or of a bug you describe. It reproduces the failure, narrows it down along the execution flow, tests one hypothesis at a time, and shows you the root cause and planned fix before editing; then it makes the smallest fix and re-runs the failing test. Application code only: test bugs go to /test, design problems to /architect."
argument-hint: "<feature> [task number] | <bug description>"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /fix

Trust evidence over intuition: reproduce the failure on demand, narrow it to the smallest failing surface, and change one thing at a time. A fix you can't explain is a bug you haven't caught.

## Rules

- Fix the root cause, never the symptom: no clamping a null, no catching and ignoring an error.
- One hypothesis at a time; undo any change that didn't help. Never fix on a hunch.
- Show the root cause and planned fix before editing (Step 5).
- Application code only. A test bug → `/test <feature> NN` (repair); a design flaw or ambiguous AC → `/architect <feature>`; a product question → the user, or `/scope`.
- No features or unrelated refactors riding along. A fix never weakens an invariant in `.ai/architecture.md`.
- The gates apply: test-run consent, schema changes, dependencies, external tools, lint. Rule files are read-only.
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking).

## Step 0: Capture the symptom

- **From `/check`:** read the task's latest Check line and the tracker: the failing test, expected vs actual, and its class.
- **From the user:** the observed behavior (exact error, stack trace, request and response, logs, ids), the expected behavior, and the steps to reproduce (entry point, input, identity, environment). Ask for what you can't work out; you can't fix what you can't reproduce.
- **Owning task:** the one whose Source Files cover the faulty area. If none does, ask which feature it belongs to.
- If the evidence says test bug, design conflict or environment, route it and stop.

## Step 1: Load

The owning task, the `AC-N` involved, the relevant `system-design.md` sections, `.ai/architecture.md` › Execution flow, the `.ai/areas/` file of the affected area if the repo has them (it overrides the repo-wide rules), and the stack skills `AGENTS.md` › Skills names. The acceptance criteria and the design decide what "correct" means.

## Step 2: Reproduce

Get a reproduction that fails every time: the failing test (through the consent), a request, a job, a script or UI steps. For an intermittent failure, find the trigger: timing, ordering, retries, state leaking between runs, data or concurrency. If you can't reproduce it, say so and propose temporary logging, added only with the user's OK.

## Step 3: Narrow it down

- Find where good input turns into bad output along `.ai/architecture.md` › Execution flow: entry → validation → logic → data access → store, or enqueue → worker → status.
- For a regression, read the history: `git log -p` on the suspect files. `git bisect` changes the working tree: on a clean tree only, ask `I'll run git bisect and report the first bad commit (Recommended)` · `Skip bisect`; never run it, stash, check out or reset their work yourself.
- Read the actual values at each boundary: test output, logs, recorded calls. A database read goes through the user, or through an external tool only with their explicit yes.
- For a long hunt, spawn a read-only investigation subagent with the symptom, the reproduction and the files; it returns the root cause with evidence and never edits.

## Step 4: Hypothesize and test

State one specific hypothesis an experiment could prove wrong, then run the smallest experiment: a log line, an assertion or a one-line probe. Refuted → remove the probe and narrow again. Repeat until the evidence confirms the root cause.

## Step 5: Confirm the plan

Show:

- the root cause, with its evidence;
- the minimal fix: the files and the change;
- the same bug elsewhere, found by search: fixed when it's inside this task's files, only reported otherwise;
- existing tests that asserted the buggy behavior (they will be updated);
- the gates ahead.

Ask `Apply this fix (Recommended)` or `Adjust`.

## Step 6: Fix and verify

1. Make the minimal change at the root cause, and remove any temporary logging. A fix that needs a schema change follows `.ai/ai-workflow-rules.md` › Gates › Schema changes.
2. Re-run the reproduction, then the task's recorded tests, through the consent: the reproduction passes and nothing new fails.
3. `lint:fix` on the files the fix changed (review what it changed), and `typecheck`.
4. If no failing test existed, hand a regression test to `/test <feature> NN`: the level that would have caught it, and the exact case.

## Step 7: Record

- **Task file › Implementation Record:** the fixed files under Source Files (`updated`), any updated tests under Existing Tests Updated, and a Fixes line: date · failure · root cause · fix.
- **Tracker:** In Progress `Task NN: built, awaiting /check` (a Completed task reopens this way); Next Up `/test <feature> NN` for a handed-off regression test, then `/check <feature> NN`. At most 60 lines.

## Report

```
## /fix <feature> · Task NN · <fixed | needs design | not reproduced>
**Root cause: <proven cause>. Fixed by <minimal change, files>.**
Reproduction passes · task tests N/N · lint ✓ · typecheck ✓
Next: /check <feature> NN   (or /test <feature> NN first, for the regression test)
Heads up: <same cause found elsewhere · design flaw → /architect>   (omit if none)
```

End with the next-step picker: `Run <the Next step for this outcome> now` · `Stop here`. Recommend running it when it continues the same task; recommend stopping, with a fresh context (Claude Code `/clear`, Codex `/new`), when it starts a new task, phase or feature: the task files and trackers hold the state.
