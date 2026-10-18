# Task [NN]: [Task Title]

## Source

- **Feature Overview**: `.ai/feature-spec/<feature>/feature-overview.md` (§ [sections])
- **System Design**: `.ai/feature-spec/<feature>/system-design.md` (§ [sections])
- **Rules**: [the `.ai/` sections this task touches, e.g. `.ai/code-standards.md` § Data access]
- **Progress Tracker**: `.ai/feature-spec/<feature>/progress-tracker.md`

## Objective

[One short paragraph: what the user, caller or system can do once this task is complete.]

## Background

Depends on: [Task NN, Task NN | none]

[The context needed to understand why this task exists and how it should behave.]

## Scope

### In Scope

- [The behavior, endpoint, screen, job or module to build or change]

### Out of Scope

- [Related work not included; files or boundaries to avoid]

## What to Implement

### 1. [Area]

- [A concrete change; its data, access, contract or validation behavior; an edge case to preserve]

## Files to Inspect

1. `[path]`: [why]

## Contracts

[Cite the design's sections instead of copying them.]

- **Data**: [the store or state owner]
- **Inputs**: [payload, params, identity and tenant, records, events, files]
- **Outputs**: [response, persisted record, event, job, file, UI state]
- **Validation**: [required fields, permissions, access constraints, error states]
- **Compatibility**: [existing behavior or contracts to preserve]

## Acceptance Criteria

1. [A specific, verifiable condition] (AC-N)
2. `lint` and `typecheck` pass on the changed files.
3. The feature's progress tracker is updated.

## Verification Plan

- [A manual check the user runs, for behavior only a real environment proves; or "None".]

### Tests

[Written by `/architect`: one line per level in `.ai/code-standards.md` › Testing › Levels. `/develop`, `/test` and `/check` read this block to decide what runs.]

- [level]: [this task · the cases, each with its AC-N] | [none · reason]

## Open Questions

- [A decision needed before or during implementation, or "None."]

## Implementation Record

[Only "Not started." while planned. One line per entry, no narrative: `/develop` fills Source Files and Existing Tests Updated; `/test` fills Test Files and Coverage; `/fix` and `/test` append Fixes; `/check` appends Check.]

### Source Files

- [created | updated | removed]: `[path]`

### Existing Tests Updated

- `[path]`: [why]

### Test Files

- [level]: `[path]` ([N] tests)

### Coverage

- [AC-N or scenario] · [level]: `[path]` › [describe block or test name]
- [AC-N or scenario] · [level]: [partial | missing] · [what's uncovered] · [accepted by the user on date | routed to …]

### Fixes

- [date] · [failure] · [root cause] · [fix and files]

### Check

- [date] · [PASS | FAIL | BLOCKED] · [commands with pass counts] · [scenarios: C covered · P partial · M missing] · [AC-N proof]
