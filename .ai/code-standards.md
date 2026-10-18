# Code Standards

Use these repository-wide conventions with the owning area file. Placement is in `.ai/folder-structure.md`; domain definitions are in `.ai/project-overview.md`.

## General

- Keep a change inside its owning module or component unless the approved feature needs a shared boundary.
- Prefer focused functions, explicit contracts and early returns. Reuse existing behavior before adding another abstraction.
- Fix the cause of a failure; remove replaced code and update its references.
- Change only what the task requires. Measure before optimizing.
- Explain non-obvious numerical rules, timing assumptions and concurrency boundaries in useful comments; keep feature design in its specification.
- Follow the PRD for product requirements and repository code for implemented behavior. Preserve proposed defaults as proposals.

## Lint and types

- Use ESLint 10 flat configs and shared tooling rules; preserve NodeNext imports and generated-file exclusions. Formatting uses double quotes and a 100-column Prettier width. Do not disable checks or weaken configuration to manufacture a pass.
- API and web TypeScript configurations are strict; preserve each area's ESM import conventions.
- Use type-only imports for types; preserve runtime imports needed for NestJS decorators and dependency injection.
- Model domain states and contract values explicitly rather than spreading unchecked values through the application.

## HTTP and application boundaries

- Match the existing NestJS module/controller structure and shared `configureApp` wiring.
- Keep the implementation and `docs/openapi.yaml` aligned when an implemented API changes.
- Validate new input contracts at the server boundary. Do not infer that configuration validation already validates future request DTOs.
- Enforce authenticated ownership before product data access; the current public liveness route is an explicit exception.
- Use the product invariants in `.ai/architecture.md` for any future approval, risk, news or execution code.
- Keep deterministic domain calculations independent of HTTP, persistence, queues and broker clients.

## Browser behavior

- Keep request cancellation, bounded waiting, retry and visible loading/error/success states explicit.
- Keep secrets and execution authority on the server.
- Preserve semantic controls, keyboard focus and responsive behavior.
- Introduce routers, UI libraries or server-state libraries only through a feature's dependency decision.

## Commands

These are the verification command roles. An area's Commands table overrides its roles for files in that area. Run them from the repository root on the runtime pinned in `.node-version`. Replace `<paths>` with paths relative to the selected workspace; never pass the placeholder literally. A `none` role is n/a, not passed.

| Role | Command | Notes |
| --- | --- | --- |
| `lint` | `npm run lint` | Read-only workspace checks; use area overrides for changed files |
| `lint:fix` | `none` | Area overrides supply targeted fixes; never rewrite unrelated files |
| `typecheck` | `npm run typecheck` | Both applications |
| `build` | `npm run build` | Required for wiring, dependency, compiler, bootstrap or build configuration changes |
| `test:unit` | `npm exec --workspace @trading/api -- vitest run src` | Source-file filter; currently no unit specifications, so report this level n/a |
| `test:integration` | `npm run test:e2e` | Full API HTTP integration level |
| `test:all` | `npm test` | All configured tests; currently API only |
| `test:related` | `npm exec --workspace @trading/api -- vitest related --run <paths>` | Changed API source paths; include recorded feature tests separately |
| `test:list` | `npm exec --workspace @trading/api -- vitest list <paths>` | List selected API specifications without running them |
| `check:format` | `npm run format:check` | Read-only application formatting check; kit rules are excluded |
| `run` | `npm run dev` | Starts both local apps; stop verification processes afterward |
| `codegen` | `none` | No schema/client generator configured |

Only the listed roles and area overrides count as automated verification. The root formatting write script can rewrite many files; use the read-only format role for checks. Application test, build, install and lint commands are not part of AI kit installation verification.

## Testing

Use deterministic unit tests and real local NestJS HTTP integration within this repository. Mock or simulate external collaborators. Tests do not contact real market/news/broker services, shared databases, production resources or credentialed APIs. Database/queue/browser integration needs an explicit infrastructure task and test policy before use.

### Levels

| Level | Proves | Command role | Location | Check runs |
| --- | --- | --- | --- | --- |
| API unit, configured only | Pure rules or one provider with collaborators isolated | `test:unit` | API source `*.spec.ts` `(new)` | related + feature once tests exist |
| API HTTP integration | Nest module wiring, shared HTTP configuration and caller-visible contracts | `test:integration` | `apps/api/test/*.e2e-spec.ts` | suite |

- No web automated level is configured. An assigned component/browser criterion needs working infrastructure before it can pass.
- Local HTTP integration is not browser or broker evidence.
- Scale tests to behavior and risk. Do not add tests that merely mirror a reversible presentation edit.
- Financial arithmetic, ownership, immutable approvals, duplicates, concurrency and ambiguous execution need the PRD's applicable adversarial cases.

### Fixtures

- Reuse the owning specification's setup. There are no shared factories or fixture directories yet.
- Create a shared fixture location only when reuse justifies it and mark it `(new)` in the task.
- Restore test doubles between cases; control the clock and randomness where the behavior depends on them.

### Rules

- Test a caller-visible requirement or invariant, not internal structure or a coverage percentage.
- Give each case an independent setup, action and assertion. Test order must not carry state.
- Keep acceptance-criterion mappings in the task's Coverage record rather than test names.
- For protected behavior, cover missing identity and another account's records as well as the owner's valid path.
- For stateful product behavior, cover invalid transitions, stale inputs, duplicates and the relevant dependency failure.
- Do not weaken or delete a correct failing test to manufacture a pass. Route a production-code defect to its owning implementation task.
- Apply the selected consent policy in `.ai/ai-workflow-rules.md` before execution.

### Coverage

- A task's scenarios include its Tests block, product acceptance criteria, contract validation/error states, cited design edge cases and relevant ownership boundaries.
- `covered`: a test at the assigned level drives the scenario and asserts its outcome.
- `partial`: a test misses a required branch, uses an inadequate level or asserts too weakly to catch the defect.
- `missing`: no appropriate test exists or the recorded test cannot be found.
- The test workflow shows gaps before editing and re-audits the written tests afterward.
- The check workflow requires every assigned scenario to be covered or explicitly accepted as a recorded gap.

## Definition of Done

- The feature's requirements and acceptance criteria are met, with applicable PRD FR/AT references.
- Updated API contracts, validation, ownership and observable failure behavior agree with the implementation.
- Migration and generated-client evidence is recorded when an approved feature introduces them.
- Required lint, types, format and wiring/build checks pass; absent roles are reported n/a.
- Assigned test scenarios pass at their required levels or have an explicit recorded acceptance of the gap.
- Record relevant running-app evidence and separate local, mocked, simulated, demo and live claims.
- Feature completion includes a code review or the owner's recorded waiver.
- Only the check workflow marks a kit task or feature Completed.

## Approved foundation verification extensions

These extensions apply to `docker-prisma-foundation` as its tasks establish working infrastructure. Pending commands and missing levels are not passing evidence. Existing command roles continue to apply until their stated replacement is implemented.

| Role | Command | Activation |
| --- | --- | --- |
| `test:database` | `npm run test:db` | Task 04; dedicated local database suite |
| `codegen` | `npm run prisma:generate --workspace @trading/api` | Task 03; user-performed generation |
| `test:all` | `npm test` | Task 07; sequential API unit, API HTTP, and web component suites; database suite remains separate |
| `run` | `npm run docker:up` | Task 07; stop verification services with `npm run docker:down` |

| Level | Proves | Command role | Location | Check runs |
| --- | --- | --- | --- | --- |
| Web component | Observable React behavior with controlled requests and time | Web `test:unit` | `apps/web/src/**/*.test.ts` and `*.test.tsx` | related + feature for task checks; full suite for feature check |
| API database integration | Target isolation, Prisma operations, fixture cleanup, and database diagnostic behavior | `test:database` | `apps/api/test/database/*.db-spec.ts` | suite when assigned; full suite for feature check |

Run one test process at a time in this order: API unit, API HTTP integration, web component, API database integration. Do not repeat a mixed API suite as part of that sequence.

The database level may use only project-owned local disposable PostgreSQL and local TCP fault fixtures. Validate the target before mutation; never fall back to development configuration. Existing API HTTP and web component suites remain database-free. Shared databases, production resources, and credentialed external APIs remain excluded.

Docker networking, Windows source reload, development persistence, and the before/after development sentinel check require recorded local environment evidence. Unit or component tests alone do not prove them.
