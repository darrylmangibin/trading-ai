# Area: Web (`apps/web`)

Read with the repository rules for changes under `apps/web`. This file overrides command roles for the area; the stack inventory is in `.ai/architecture.md`.

## Layout

- Entry: `apps/web/src/main.tsx`; current screen: `apps/web/src/App.tsx`.
- Styles: `apps/web/src/App.css` and `apps/web/src/index.css`.
- Proxy/build setup: `apps/web/vite.config.ts`; lint setup: `apps/web/eslint.config.js`.
- There is no router, UI kit, server-state library or automated web test setup yet.

## Conventions

- Keep React function components and hooks consistent with the existing application.
- Use state for observable connection status; cancel obsolete requests and bound waiting time.
- Make loading, unavailable and success states understandable and retry actions explicit.
- Keep semantic HTML, visible keyboard focus and responsive layouts.
- Use the same-origin API path; keep backend credentials out of browser code and public build variables.
- Keep styles co-located with the component that owns them. Add an abstraction or dependency only through the owning feature's decision.

## Commands

Paths below are relative to `apps/web`; replace `<paths>` with the task's actual changed files. Remaining non-test roles come from `.ai/code-standards.md`.

| Role | Command | Notes |
| --- | --- | --- |
| `lint` | `npm exec --workspace @trading/web -- eslint --max-warnings=0 <paths>` | Changed files only, no fixes; warnings fail |
| `lint:fix` | `npm exec --workspace @trading/web -- eslint --max-warnings=0 --fix <paths>` | Changed files only; review the resulting diff |
| `typecheck` | `npm run typecheck --workspace @trading/web` | Source and Vite configuration |
| `build` | `npm run build --workspace @trading/web` | Typed static production build |
| `run` | `npm run dev:web` | Local web development process |
| `test:unit` | `none` | No web unit/component runner configured |
| `test:integration` | `none` | No web integration runner configured |
| `test:all` | `none` | API tests do not prove browser behavior |
| `test:related` | `none` | Not configured |
| `test:list` | `none` | Not configured |

## Testing

No automated web level is configured. For current wiring/presentation changes, record a local browser observation with the exact action and result. Before assigning component or browser test criteria, plan the required test-infrastructure task and dependency gate. A missing level is n/a, not a pass.

## Stack skills

No project-local React/design stack skill is installed by this kit. Personal and plugin skills remain outside the copied kit and apply only when available and compatible with these project rules.

## Approved Jest test extension

Task 02 of `docker-prisma-foundation` establishes the web component level. Once configured, these roles replace the corresponding `none` entries above; before then the level is pending.

| Role | Command | Notes |
| --- | --- | --- |
| `test:unit` | `npm run test --workspace @trading/web` | Jest component suite, non-watch |
| `test:all` | `npm run test --workspace @trading/web` | Full configured web suite |
| `test:related` | `npm exec --workspace @trading/web -- jest --runInBand --findRelatedTests <paths>` | Related cases plus recorded feature tests |
| `test:list` | `npm exec --workspace @trading/web -- jest --listTests` | Discover tests without execution |

Use React Testing Library with controlled requests and time. Include the test TypeScript project in typecheck. Required empty suites fail. JSDOM component evidence does not establish browser or Docker behavior; web browser integration remains unconfigured.
