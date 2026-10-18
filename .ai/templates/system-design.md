# [Feature Name] · System Design

[Written by `/architect`. Every section stays; write `None: <reason>` where one doesn't apply. `/architect` walks Boundaries through Security and Observability, in order, as its design dimensions.]

## Summary

[3–5 lines: what gets built and how.]

## Dependencies

[Prerequisite features or foundations, and whether they're built · code to reuse, as `file:line` · new packages, each with the task that needs it (the user installs them) · infrastructure, config and env vars · schema changes and their store · project-wide decisions this forces.]

## Boundaries

[Which module owns which part, and which store or state owner holds each record.]

## Data Model

[persistent data. Entities → fields → keys, ownership and relations → uniqueness and indexes → retention. A table per entity; optionally a mermaid `erDiagram`.]

## API Surface

[HTTP, RPC, GraphQL or events. Per operation: method and path (or name), auth and required headers, the request contract, the response in the owning module's established shape, errors, pagination.]

## Routes and Screens

[UI. Per route or screen: path, guard, layout, the data it needs, and its loading, empty, error and success states.]

## Components and State

[UI. The component tree for new UI; where each piece of state lives (server cache, form, local, global, URL) and why; forms and validation.]

## Public API and Compatibility

[Shared TypeScript packages, when introduced. Exports and signatures, semver impact, deprecations, migration notes.]

## Access and Isolation

[auth, roles or tenancy. One rule per caller per action, and how each is enforced server-side.]

## Async and Integrations

[background work or external systems. Queue, job and schedule names; payloads (carrying identity and account); retries and backoff; idempotency; the durable status record; external APIs, storage, caching, realtime.]

## Pipelines and Data Quality

[data work. Sources, transforms, schedules, backfills, idempotency, data checks.]

## Resources and Rollout

[infrastructure. Resources, environments, rollout and rollback, cost.]

## Flows

[A mermaid `sequenceDiagram` for the main flow and each async flow, with participants named after this system's parts. Quote labels that contain `()`, `:`, `/` or `,`.]

## Failure and Edge Cases

[Concurrency, duplicates, invalid input, partial failure, retries, offline: each with its designed outcome.]

## Security and Observability

[Sensitive data, secrets, rate limits, logging, metrics, alerts, operator visibility.]

## Value Sourcing

[Every value the feature shows, stores or computes, with its source: an input, a stored field (with its store), a derivation or an agreed decision.]

## Decisions

[Each engineering call: pick · reason · runner-up.]

## Test Strategy

| AC | Built by | [One column per configured test level] |
| --- | --- | --- |
| [AC-N] | [Task NN] | [Task NN · the case], or [none: reason] |
