---
name: sync-ai
description: "Run /sync-ai (Codex: $sync-ai) when the code, tooling or workflow has changed and the AI rules may be stale. It audits AGENTS.md, CLAUDE.md, the .ai/ rule files and templates, the kit skills and the .claude/skills links against the repository (commands, paths, modules, stack versions, test setup, invariants), shows each drift with its evidence and the proposed wording, and applies only what you approve. Also repairs missing or broken skill links. Never touches application code or feature specs."
argument-hint: "[rules | skills | links | <file>]"
metadata:
  kit: "ai-kit"
  kit-version: "1.5.0"
---

# /sync-ai

Keep the rules true. A stale rule is worse than none: agents follow it with confidence.

## Rules

- Running `/sync-ai` is the user asking to update rule files, limited to the edits they approve in Step 3.
- Never edit application code, tests, feature specs (`.ai/feature-spec/`), the trackers, or a third-party skill (one in `skills-lock.json`, or marked third-party in `.ai/kit.md` › Skills).
- Every finding carries evidence: the rule's `file › section`, and the code fact (`path:line`, a manifest entry, a script, a config, a commit).
- Read-only until Step 4: listing, reading, searching and git history only. No tests, builds, installs, network or MCP calls.
- Every question and approval opens the question tool, recommended option first and every option described (`.ai/ai-workflow-rules.md` › Asking).

## Step 0: Scope

- No argument → everything. `rules` → `AGENTS.md`, `CLAUDE.md`, `.ai/*.md`, `.ai/areas/`, `.ai/templates/`. `skills` → the skills' frontmatter and kit version. `links` → the Claude entries only. A file path → that file.
- Read `.ai/kit.md`: the kit version, the decisions, the skills table, the link commands and the last sync date.

## Step 1: Gather facts

- Manifests and lockfiles (stack and versions); scripts (`package.json`, Makefile, `composer.json`, `pyproject.toml`…); lint, format, type and test configs; CI workflows.
- The tree, to the depth `.ai/folder-structure.md` documents, and the modules `.ai/project-overview.md` › Module map lists.
- What changed since the last sync: `git log --since=<last sync date> --name-status` (new modules, removed configs, renamed scripts, new test setup).
- For a broad repo, fan out read-only subagents by area if the harness supports them.

## Step 2: Check

1. **Commands:** every command in `.ai/code-standards.md` › Commands (and each area's) still resolves: the script exists, the binary is a dependency, the config file is present. Every other mention of a command in `.ai/`, `AGENTS.md` or a skill names a role instead of restating it.
2. **Paths:** every path, glob and file a rule names exists, or is marked `(new)` or planned.
3. **Structure:** the Module map and `.ai/folder-structure.md` match the tree: new, removed or renamed modules; test locations; naming.
4. **Stack:** `.ai/architecture.md` › Stack matches the manifests' versions and libraries.
5. **Testing:** the levels, runner configs, setup files and locations in `.ai/code-standards.md` › Testing and `.ai/testing-guide.md` match the test configuration.
6. **Invariants and watchpoints:** the classes, functions and files they name still exist and still behave as stated (spot-check the code).
7. **Consistency:** no two rule files state the same fact differently; `AGENTS.md` › Read first lists every `.ai/` rule file; `CLAUDE.md` imports `AGENTS.md`.
8. **Skills:** each `.agents/skills/*/SKILL.md` has valid frontmatter (`name` equals its folder; lowercase letters, digits and single hyphens; `description` of 1–1024 characters); each kit skill carries the kit version in `.ai/kit.md`.
9. **Links:** every folder in `.agents/skills/` has a working Claude entry of the type `.ai/kit.md` records; no link is broken or points elsewhere; no `.claude/skills/<name>` is a stale real copy of a kit skill; stubs mirror their skill's frontmatter.
10. **Budgets and leftovers:** `AGENTS.md` at most 80 lines; each `.ai/` rule file at most 250 lines; trackers at most 60 lines (report only); a leftover `.ai-backup/` folder.

## Step 3: Report and ask

One table, grouped by file, wrong commands and contradictions first (they mislead agents most): # · `file › section` · finding · evidence · proposed change (exact wording). Then ask `Apply all (Recommended)`, `Let me pick` or `Apply none`.

## Step 4: Apply

- Apply exactly the approved changes, keeping each file's section headings and style.
- Repair links with the commands in `.ai/kit.md` › Skill links. Before removing anything, confirm it is a link and not a real folder, and remove only the link. In Codex, writes under `.agents/` need the user's approval (its sandbox keeps that folder read-only).
- Update `.ai/kit.md` › Last sync: the date, the findings, what was applied.

## Report

```
## /sync-ai · <in sync | N findings, A applied>
Changed: <files>
Links: <n> ok · <n> repaired
Heads up: <findings left open · tracker or spec issues for their skills · leftover backup>   (omit if none)
```
