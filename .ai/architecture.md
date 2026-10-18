# Architecture

The current system is an npm workspace with an ESM NestJS HTTP application and a React/Vite browser application. It implements configuration and liveness only; persistence, authentication, queues, market providers and trading workers are planned. The module inventory is in `.ai/project-overview.md` under Module map; placement is in `.ai/folder-structure.md`. Feature-level design belongs in its `system-design.md`.

## Stack

Versions below are locked in `package-lock.json`; manifests define the allowed ranges.

| Layer | Technology | Role |
| --- | --- | --- |
| Runtime | Node 24.17.0 in `.node-version` | Pinned project runtime |
| Language | TypeScript 6.0.3 | Strict API and web typing |
| API | NestJS 12.1.3, Express adapter, `@nestjs/config` 12.0.1 | HTTP handling and environment configuration |
| Web | React 19.3.1, Vite 8.3.4 | Browser rendering, development and static builds |
| Tests | Vitest 4.1.12, Supertest 7.3.1 | API test runner and HTTP assertions |
| Quality | ESLint 10 flat configs for API, web, and shared tooling; Prettier | Compatible EduPilot rule port; double quotes and 100-column formatting |

## Runtime

- API entry: `apps/api/src/main.ts`; default port 3000; route prefix configured by `configureApp`.
- Web entry: `apps/web/src/main.tsx`; development port 5173; local production preview port 4173.
- Vite forwards `/api` requests to the API in development and preview; static production hosting must provide that forwarding.
- API environment names: `PORT`, `CORS_ORIGIN`. Web proxy environment name: `API_PROXY_TARGET`.
- Environment examples document names; credentials and private environment files are not repository evidence to inspect.
- No database, identity provider, queue service, container deployment or CI workflow is configured yet.

## Execution flow

1. `App` in `apps/web/src/App.tsx` requests `/api/health`, with cancellation and a timeout.
2. `apps/web/vite.config.ts` forwards the request to the configured backend target.
3. API bootstrap creates `AppModule`; `ConfigModule` loads configuration and `validateEnvironment` validates the listening port.
4. `configureApp` applies the `/api` prefix and configured CORS origin; `HealthController.getHealth` returns the liveness response.
5. `App` verifies the response and renders connected or unavailable status. Cleanup cancels an obsolete request.

## Boundaries

| Boundary | Owns | Never owns |
| --- | --- | --- |
| Web | Rendering, transient UI state and requests | Broker credentials or authority to bypass server approval/risk gates |
| API | HTTP contracts, configuration and application orchestration | Unrecorded execution or caller-controlled authorization |
| Domain engine (planned) | Deterministic numerical decisions as pure TypeScript functions | NestJS, Prisma, database connections or broker submission |
| Application services/workers (planned) | Persistence and orchestration around domain results | Authority to waive product invariants |
| Broker adapter (planned) | Qualified submission and authoritative reconciliation | LLM-generated order authority |

## Access

- The implemented liveness endpoint is intentionally unauthenticated; its contract is `docs/openapi.yaml`.
- Authentication and ownership checks are not implemented. Add them before exposing account, setup, approval, execution or journal operations.
- A public liveness exception does not establish a public product endpoint convention.

## Invariants

Current wiring:

1. Product HTTP paths use the API prefix; the web client uses the same-origin proxy path.
2. Server configuration validates the listening port before the application starts.
3. Liveness reports process availability, not database, market-feed or broker readiness.

Product invariants for future features, sourced from the PRD and not yet implemented:

1. An approval-required entry needs an authenticated, unexpired decision for its exact immutable terms.
2. Persist and reserve the execution intent before submission; reconcile ambiguous results before another entry.
3. Enforce required data freshness, ownership, account exposure and risk gates on the server.
4. Keep paper, broker-demo and live environments isolated; live enablement requires explicit owner authorization.
5. Keep decimal values precise and preserve point-in-time evidence and strategy/configuration versions.
6. Treat news text as untrusted data. LLM output cannot submit an order, invent probability or waive a gate.
7. Preserve approved protective exits when pausing entries; retain evidence until unresolved risk is reconciled.

## Watchpoints

- PRD section 8.1 recommends Jest; the installed runner is Vitest. Use repository tooling for implementation facts.
- The PRD component diagram draws the domain engine toward PostgreSQL. Preserve the pure-domain boundary above: services or workers persist returned results.
- PRD representative endpoints are proposed interfaces, not implemented routes. Apply the existing API prefix when designing them.
- MUI, TanStack Query, Lightweight Charts, Prisma, PostgreSQL, Redis, BullMQ, Playwright and external adapters are planned dependencies, not installed capabilities.
- API tests named e2e currently boot NestJS in-process with local HTTP; they do not exercise a browser, database or broker.
- API/web lint configuration lives in `apps/api/eslint.config.js` and `apps/web/eslint.config.js`; shared rules live in `tooling/eslint/`. Compatibility decisions are documented in `docs/eslint-adoption.md`.
- Follow the next feature's approved design before introducing a worker or shared package. The target workspace in the PRD is not today's folder inventory.

## Approved Docker and persistence foundation plan

The `docker-prisma-foundation` design is approved but not yet implemented. Current Stack and Runtime entries above describe the existing code; implementation status is in the feature tracker.

- Local Docker development will expose the frontend on 6789, API on 9876, development PostgreSQL on 5554, and isolated test PostgreSQL on 5556, bound to loopback.
- Separate Supabase PostgreSQL instances own `trading_dev` and `trading_test`. The development instance also hosts migration-only `trading_shadow`; it has no additional host port.
- NestJS will own a lazy Prisma client. Process liveness and existing HTTP tests remain independent of database configuration and availability.
- Prisma schema/client generation and migration operations remain explicit under the existing user-performed gates. Startup does not apply migrations.
- Frontend tests will use Jest and React Testing Library; API tests retain Vitest. Database integration uses a separate guarded local test target.
- Development data and PostgreSQL configuration volumes survive normal shutdown and recreation. Private configuration is excluded from images and frontend inputs.

Details, alternatives, dependency pins, and task ownership are in `.ai/feature-spec/docker-prisma-foundation/system-design.md`.
