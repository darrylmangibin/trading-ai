# Testing Guide

Policy and level definitions live in `.ai/code-standards.md` under Testing; executable commands live only in its Commands table and area overrides. Area-specific notes are in `.ai/areas/api.md` and `.ai/areas/web.md`.

## Placement

- Extend `apps/api/test/app.e2e-spec.ts` for behavior of the existing liveness endpoint and shared HTTP configuration.
- Place new API HTTP integration specifications in `apps/api/test/` with the `.e2e-spec.ts` suffix.
- Place API unit specifications beside the source as `*.spec.ts`; this glob is configured but no unit specifications exist yet.
- Web component and browser test infrastructure is not installed. Plan a test-infrastructure task before assigning a new automated web level.

## Setup by level

### API HTTP integration

Follow `apps/api/test/app.e2e-spec.ts`:

1. Import reflection metadata and create a Nest testing module that imports `AppModule`.
2. Create the Nest application and call `configureApp`, so the tested prefix and CORS configuration match bootstrap.
3. Initialize the app and drive its local HTTP server with Supertest.
4. Assert caller-visible status, content type, response shape and the relevant headers or error behavior.
5. Close the app in teardown. Use fresh local state for specifications that mutate it.

Existing cases prove the health response contract, absence of an unprefixed route and the configured frontend origin. They do not prove authentication, provider readiness or trading correctness.

### API unit, configured only

- Use Vitest's existing source-spec discovery and test globals.
- Instantiate pure functions directly; use Nest's testing module when dependency injection is the behavior under test.
- Mock collaborators that the unit does not own. Exercise observed results and failures rather than call counts alone.
- The first specification must establish its own fixtures; there is no shared fixture or factory library yet.

## Mocking

| Collaborator | Approach | Existing evidence |
| --- | --- | --- |
| Nest HTTP pipeline | Boot the real module and shared HTTP configuration | `apps/api/test/app.e2e-spec.ts` |
| Clock and randomness | Use deterministic Vitest controls when a feature introduces time/random behavior | No existing timed domain tests |
| Market/news/broker APIs | Use approved local stand-ins or deterministic fixtures; no real credentials | Integration not implemented |
| Database and queues | First establish an explicit disposable-service policy and infrastructure task | Not configured |

## Relevant cases

| Case | Evidence to assert |
| --- | --- |
| Normal result | The caller-visible contract and resulting state |
| Invalid input or state | The defined failure and absence of unintended effects |
| Ownership, when implemented | Missing identity and access to another account or record |
| Duplicate or concurrent action | A single valid transition and preserved immutable terms |
| Time boundary, when introduced | Behavior at expiry and with stale inputs using a controlled clock |
| Dependency failure | An observable failure state without inconsistent submission or persistence |

Use PRD sections 5, 12 and 15 to select adversarial cases for product features. Do not infer those cases are covered by the existing liveness tests.

## Execution

- Use unattended, non-watch command roles and the selected consent policy in `.ai/ai-workflow-rules.md`.
- An empty test level is n/a, not a passing level. A test infrastructure failure or running process is unverified.
- Keep unit, HTTP integration and future browser evidence distinct.
- A test requiring real provider credentials violates the current policy. Correct its stand-in instead of supplying secrets.

## Approved foundation test setup

The following setup becomes available through the infrastructure tasks in `docker-prisma-foundation`; it is not evidence of existing coverage.

- Web component tests use Jest, JSDOM, and React Testing Library. Control fetch and timers; aborted request doubles must reject. Restore state between cases and characterize StrictMode cleanup and obsolete responses.
- API database tests use a dedicated Vitest configuration and `.db-spec.ts` suffix, outside existing HTTP discovery. Read only explicit test configuration, validate the endpoint, and verify the connected database and role before fixture mutation.
- Temporary fixtures belong to one transaction and are removed on success or rollback. Test connection targets cannot fall back to development values.
- Database diagnostic process tests may use an owned local TCP fixture that stalls the PostgreSQL handshake. Verify the compiled command's overall deadline and credential-free output.
- Keep development sentinel verification outside the isolated test runner. The developer creates, checks, and removes only the verification record identified in the task.
- API tests must control configuration before importing the application and must not load private environment files.
