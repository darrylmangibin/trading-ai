# Folder Structure

Follow the owning application's existing layout. The repository currently has two applications; planned paths are marked `(new)` and are created only by an approved feature task.

## Repository

```text
.ai/                         Project rules, records and feature templates
  areas/                     API and web conventions
  templates/                 Reusable feature, design, task and tracker templates
  feature-spec/              Feature files; populated by the scope workflow
.agents/skills/               Canonical kit workflow skills; managed rules
.claude/skills/               Claude entries selected during kit setup
apps/
  api/
    src/
      config/                Environment validation
      health/                Health module and controller
      app.module.ts          Root module
      configure-app.ts       Shared HTTP configuration
      main.ts                API entry
    test/                    HTTP integration specifications
    dist/                    Generated build output; do not edit
  web/
    src/                     App, entry, co-located styles
    dist/                    Generated static output; do not edit
    vite.config.ts           Development and preview proxy
    eslint.config.js         Web lint configuration
docs/openapi.yaml            Implemented API contract
FOREX_AI_PRD.md               Detailed product source
AGENTS.md                    Shared agent entry point
CLAUDE.md                    Claude entry selected during kit setup
package.json                 Workspace scripts and applications
package-lock.json            Generated dependency lock; dependency gate applies
node_modules/                Generated dependencies; do not edit
```

## API module layout

Use the implemented health feature as the current example:

```text
apps/api/src/health/
  health.module.ts
  health.controller.ts
apps/api/test/
  app.e2e-spec.ts
```

- Keep a feature's NestJS controllers and providers inside its owning module directory.
- Add a service, DTO or helper only when the feature needs it; mark every proposed new path `(new)` in the task.
- Keep HTTP integration specifications in `apps/api/test/`.
- Co-located unit specifications under `apps/api/src/` are configured but not populated yet.

## Web layout

- Keep the existing `App.tsx`, `main.tsx`, `App.css` and `index.css` responsibilities distinct.
- Co-locate new components and styles with the feature that owns them; the feature design names new directories before creating them.
- No router, global state layer or reusable component hierarchy is established yet.

## Planned workspace paths

The PRD proposes `apps/worker/` `(new)`, `packages/domain/` `(new)` and `packages/contracts/` `(new)`. They do not exist or participate in the workspace yet. A feature introducing one must update workspace wiring and verification explicitly.

## Tests

| Level | Runner/config | Naming | Placement |
| --- | --- | --- | --- |
| API unit, configured only | Vitest, `apps/api/vitest.config.ts` | `*.spec.ts` | `apps/api/src/` `(new)` |
| API HTTP integration | Vitest, API Vitest configs | `*.e2e-spec.ts` | `apps/api/test/` |
| Web automated tests | Not configured | Defined by the first test-infrastructure task | `(new)` |

Command roles and level policy live in `.ai/code-standards.md`; setup recipes live in `.ai/testing-guide.md`.

## Naming

- API files use kebab-case and NestJS suffixes such as `.module.ts` and `.controller.ts`; classes use PascalCase.
- API source uses ESM imports with `.js` suffixes for local TypeScript modules.
- Web component files use PascalCase; web entry and configuration names follow their existing files.
- Use type-only imports for type-only values, consistent with each area's compiler configuration.
- Feature folders and task titles use kebab-case as the kit templates specify.
- Do not edit generated `dist/`, dependency files under `node_modules/` or `*.tsbuildinfo` artifacts.
