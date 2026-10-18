# AI Kit

Installed by AI kit v1.5.0 on 2026-10-18. Setup mode: fresh. This manifest is a setup record, not a rule file.

Source: `D:/komento/ai-kit/ai-kit.md`. Project files are self-contained; this path records provenance.
Source SHA-256: `C439C6A9FDE107FB2999C627E6DBA10AE51CDD4D131C1DF30001264105DA4B2F`.

Approval: the user selected “Write everything, then I review (Recommended)” for the displayed settings and file plan.

## Decisions

| ID | Decision | Choice |
| --- | --- | --- |
| S1 | Agents | Codex + Claude Code |
| S2 | Sharing | No Git repository; files remain local. Do not initialize Git. Exclude machine-local junctions and backups. |
| S3 | Skill links | One Windows junction per skill; canonical content stays in .agents/skills. |
| S4 | Areas | Separate API and web rule files. |
| S5 | Codex picker | Already enabled; no user configuration change. |
| P1 | Product | Reviewed PRD is the detailed product source; concise overview distinguishes current and planned capabilities. |
| P2 | Module map | Existing API/configuration/health and web/App only; no planned module represented as implemented. |
| P3 | Patterns | Keep each area's existing TypeScript, imports, lint and styling patterns. |
| P4 | Invariants | Carry PRD approval, ownership, environment, evidence and reconciliation boundaries; trading defaults remain proposed. |
| C1 | Test levels | Existing API HTTP integration; source unit discovery configured but empty; web automation not configured. |
| C2 | Test access | Local owned HTTP and deterministic isolated logic; external services mocked or simulated. New real-service levels need explicit infrastructure/policy. |
| C3 | Checks | Targeted area lint, type checks and formatting checks; build for wiring, dependency/compiler/bootstrap/build changes. |
| C4 | Done | Applicable FR/AT traceability, aligned contracts, assigned tests and evidence; do not equate foundation scaffolding with a product release. |
| W1 | Feature gate | Named feature for kit workflows; reuse context already supplied. Ordinary questions and small changes do not require feature selection. |
| W2 | Check consent | Run local repository checks freely; report exact commands and results. |
| W3 | Change gates | User installs dependencies and applies new migrations; agent drafts them. Reuse later explicit authorization; unrequested shared/external operations need consent. |
| W4 | Git | Never initialize, commit, push or rewrite history unless asked. |
| W5 | Feature review | Code review required, or the owner's recorded waiver. |
| K1 | Workflow skills | All seven upstream kit v1.5.0 skills, unchanged. |
| K2 | Stack skills | No extra project-local copies. Leave personal/plugin skills untouched. |
| K3 | Name clashes | No matching project or personal kit skill names found during preflight. |
| K4/K6 | Legacy material | Not applicable: fresh installation; no existing kit specs or trackers to move. |
| K5 | First feature | None during installation. Scope a named feature after setup. |

## Skills

| Skill | Source | Claude entry |
| --- | --- | --- |
| `scope` | kit v1.5.0, unchanged | Junction |
| `architect` | kit v1.5.0, unchanged | Junction |
| `develop` | kit v1.5.0, unchanged | Junction |
| `test` | kit v1.5.0, unchanged | Junction |
| `check` | kit v1.5.0, unchanged | Junction |
| `fix` | kit v1.5.0, unchanged | Junction |
| `sync-ai` | kit v1.5.0, unchanged | Junction |

## Skill links

Run from the project root. Replace `<name>` with one of the seven skill names above. Junctions store absolute targets; recreate them after moving the repository. These links are excluded from Git.

Create (kit section 12.2):

```powershell
New-Item -ItemType Directory -Force .claude\skills | Out-Null
cmd /c mklink /J ".claude\skills\<name>" ".agents\skills\<name>"
```

Verify:

```powershell
Get-Item -LiteralPath '.claude/skills/<name>' | Select-Object LinkType, Target
Test-Path -LiteralPath '.claude/skills/<name>/SKILL.md'
```

Remove only a verified junction with a non-recursive native operation:

```powershell
$kitLinkRoot = [System.IO.Path]::GetFullPath('.claude/skills') + [System.IO.Path]::DirectorySeparatorChar
$kitLinkPath = [System.IO.Path]::GetFullPath('.claude/skills/<name>')
if (-not $kitLinkPath.StartsWith($kitLinkRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'The link path must stay inside this project skills directory.'
}
$kitLink = Get-Item -LiteralPath $kitLinkPath
if ($kitLink.LinkType -ne 'Junction') { throw 'Refusing to remove a real folder or another link type.' }
[System.IO.Directory]::Delete($kitLinkPath)
```

Never use recursive deletion on a skill link. The target is the canonical skill and must remain intact.

## Files

Approved file plan:

| Path | Action | Source |
| --- | --- | --- |
| `.ai/kit.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/project-overview.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/architecture.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/folder-structure.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/testing-guide.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/project-progress-tracker.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/code-standards.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/ai-workflow-rules.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/areas/api.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `.ai/areas/web.md` | Create | Kit section 9, repository profile and approved PRD summary |
| `AGENTS.md` | Create | Kit section 10 |
| `CLAUDE.md` | Create | Kit section 10 |
| `.ai/templates/feature-overview.md` | Create | Kit sections 9.8–9.11 |
| `.ai/templates/system-design.md` | Create | Kit sections 9.8–9.11 |
| `.ai/templates/task.md` | Create | Kit sections 9.8–9.11 |
| `.ai/templates/progress-tracker.md` | Create | Kit sections 9.8–9.11 |
| `.agents/skills/scope/SKILL.md` | Create | Kit section 11, exact copy |
| `.agents/skills/architect/SKILL.md` | Create | Kit section 11, exact copy |
| `.agents/skills/develop/SKILL.md` | Create | Kit section 11, exact copy |
| `.agents/skills/test/SKILL.md` | Create | Kit section 11, exact copy |
| `.agents/skills/check/SKILL.md` | Create | Kit section 11, exact copy |
| `.agents/skills/fix/SKILL.md` | Create | Kit section 11, exact copy |
| `.agents/skills/sync-ai/SKILL.md` | Create | Kit section 11, exact copy |
| `.ai/feature-spec/` | Create empty directory | Feature workflows populate it later |
| `.claude/skills/scope` | Create junction | `.agents/skills/scope` |
| `.claude/skills/architect` | Create junction | `.agents/skills/architect` |
| `.claude/skills/develop` | Create junction | `.agents/skills/develop` |
| `.claude/skills/test` | Create junction | `.agents/skills/test` |
| `.claude/skills/check` | Create junction | `.agents/skills/check` |
| `.claude/skills/fix` | Create junction | `.agents/skills/fix` |
| `.claude/skills/sync-ai` | Create junction | `.agents/skills/sync-ai` |
| `.gitignore` | Update ignore entries | Local junctions and kit backups |
| `.prettierignore` | Update ignore entries | Protect managed kit files and backups |
| `.ai-backup/20261018-154335/.gitignore` | Back up | Existing `.gitignore`, verified before editing |
| `.ai-backup/20261018-154335/.prettierignore` | Back up | Existing `.prettierignore`, verified before editing |

Generated: 23 kit files plus seven Claude junctions. Moved: none.
Backup: `.ai-backup/20261018-154335/`. Retain it for the user's review.
Preserved: application source/configuration, package manifests and lockfile, PRD, README and existing personal/plugin skills.

## Setup progress

- [x] 1 Backup
- [x] 2 Manifest
- [x] 3 Rule files and areas
- [x] 4 Templates
- [x] 5 Specs
- [x] 6 Skills
- [x] 7 Claude links
- [x] 8 Agent entry files
- [x] 9 Ignore rules
- [x] 10 Other agents
- [x] 11 Codex picker
- [x] 12 Structural verification

## Verification notes

- 2026-10-18 structural verification PASS: 23 planned kit files, eight rules, four templates, seven canonical skills and seven readable Claude junctions.
- All seven skills match their upstream source blocks after LF normalization; YAML metadata, naming, descriptions and line budgets pass the kit schema.
- The six required Asking bullets and AGENTS.md question-tool bullet are preserved verbatim; the original Postman instruction is retained.
- Twenty verification command roles resolve statically to current scripts or declared local binaries. No verification command was executed against the applications.
- Checked 146 concrete path references, with the three future workspace paths marked new. The public file inventory contains only planned additions and known existing files.
- Both ignore-file backups retain their original hashes; all 35 hashed existing application/document/configuration files are unchanged.
- Specs and other-agent steps are complete as not applicable: no legacy feature material existed and no additional agent was requested. The existing Codex picker remains enabled.
- Application tests, builds, package operations, migrations, formatting and linting are not run by this installation.
- Shared kit metadata includes `argument-hint` and angle-bracket invocation examples. Preserve the canonical frontmatter; validate against the kit schema rather than stripping fields for a narrower generic validator.
- Harness UI discovery is not observable from filesystem checks; load a fresh Codex/Claude project session to confirm the skills appear.

## Last sync

- 2026-10-18 · approved fresh setup complete; structural checks passed; harness UI discovery awaits the user's review
