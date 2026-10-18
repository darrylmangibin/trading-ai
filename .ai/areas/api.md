# Area: API (`apps/api`)

Read with the repository rules for changes under `apps/api`. This file overrides the repository command roles for this area; the stack inventory is in `.ai/architecture.md`.

## Layout

- Entry: `apps/api/src/main.ts`; composition: `apps/api/src/app.module.ts`.
- Shared HTTP setup: `apps/api/src/configure-app.ts`; environment validation: `apps/api/src/config/environment.ts`.
- Current feature: `apps/api/src/health/`; current HTTP tests: `apps/api/test/app.e2e-spec.ts`.
- Feature modules own their controllers/providers. No persistent data access layer exists yet.

## Conventions

- Use NestJS decorators and dependency injection where a collaborator exists; do not add a service solely to return a fixed value.
- Keep configuration access in the existing ConfigModule/ConfigService path.
- Apply `configureApp` to HTTP test applications so the tested prefix and CORS behavior match runtime.
- Keep local ESM imports suffixed `.js` and types imported as types.
- Validate new HTTP DTOs in the feature that introduces them. Configuration validation does not establish a global request-validation policy.
- Keep contracts aligned with `docs/openapi.yaml`; consult the Postman API engineering entry skill for non-trivial API work when it is available in the harness.
- Apply `.ai/architecture.md` under Invariants before adding trading-domain behavior.

## Commands

Paths below are relative to `apps/api`; replace `<paths>` with the task's actual changed files. Remaining roles come from `.ai/code-standards.md`.

| Role | Command | Notes |
| --- | --- | --- |
| `lint` | `npm exec --workspace @trading/api -- eslint --max-warnings=0 <paths>` | Changed source/test files, no fixes; warnings fail |
| `lint:fix` | `npm exec --workspace @trading/api -- eslint --max-warnings=0 --fix <paths>` | Changed files only; review the resulting diff |
| `typecheck` | `npm run typecheck --workspace @trading/api` | Includes tests and configuration in the typed project |
| `build` | `npm run build --workspace @trading/api` | Required when API wiring or build inputs change |
| `run` | `npm run dev:api` | Local API watch process; not an unattended test command |

API lint configuration lives in `apps/api/eslint.config.js`; shared rules live in `tooling/eslint/`. Generated Prisma code is excluded.

## Testing

| Level | Proves | Command role | Location | Check runs |
| --- | --- | --- | --- | --- |
| Unit, configured only | Pure rules/provider behavior with isolated collaborators | `test:unit` | Source `*.spec.ts` `(new)` | related + feature once tests exist |
| HTTP integration | Nest wiring, HTTP contract, prefix and configured origin | `test:integration` | `apps/api/test/*.e2e-spec.ts` | suite |

Use `.ai/testing-guide.md` for setup. Keep shared real databases, provider calls and real credentials out of both existing levels.

## Stack skills

No project-local NestJS stack skill is installed by this kit. Personal and plugin skills remain outside the copied kit and apply only when available and compatible with these project rules.
