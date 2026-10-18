# ESLint and Makefile adoption

Trading adopts the compatible parts of `D:/projects/edupilot-ai` while keeping ESLint 10, TypeScript 6, and the existing application behavior.

## What was reviewed

- `backend/.eslintrc.cjs`: Airbnb base/TypeScript, Node, NestJS, explicit-any prohibition, unused-variable conventions, and spacing overrides.
- `frontend/.eslintrc.cjs`: Airbnb React/TypeScript, accessibility, component/refresh rules, and formatting overrides.
- `Makefile`: application formatting and Docker dependency recovery.
- Public package manifests and plugin compatibility metadata. Private environment files were not inspected.

## Adopted configuration

Both applications use flat `eslint.config.js` files, with shared rules in `tooling/eslint/`. The reference's compatible inherited Airbnb/TypeScript rules are stored locally; running Trading never loads files from EduPilot or legacy Airbnb packages.

- Errors for explicit `any`, the reference's unused-variable conventions, and its control-flow/import rules.
- Double quotes, semicolons, trailing commas, one final newline, no trailing whitespace, and the reference's statement spacing.
- Prettier uses the reference's 100-column width and two-space indentation.
- Node and NestJS checks for API code; Swagger requirements stay disabled because this project uses its existing OpenAPI file.
- Modern React and JSX accessibility checks for the frontend, plus existing React Hooks and refresh checks.
- Dedicated test/tooling overrides permit their declared development dependencies.
- Generated Prisma output, dependencies, builds, coverage, and TypeScript build information are excluded.
- Read-only lint fails on warnings. Fixing is explicit through `lint:fix` or the formatting targets.

The source rule snapshots retain third-party licensing in `tooling/eslint/THIRD_PARTY_LICENSES.md`.

## Compatibility decisions

| Reference behavior                                                       | Trading adaptation                                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Legacy ESLint 8 and `.eslintrc.cjs`                                      | ESLint 10 flat config                                                                                                    |
| Legacy Airbnb runtime packages                                           | Local compatible rule snapshot, with provenance                                                                          |
| Removed TypeScript formatting rules                                      | ESLint Stylistic equivalents                                                                                             |
| `eslint-plugin-import`                                                   | `eslint-plugin-import-x` with the TypeScript resolver                                                                    |
| Legacy `eslint-plugin-react`                                             | `@eslint-react/eslint-plugin`; modern equivalents are not identical to every legacy class/propTypes/component-style rule |
| `eslint-plugin-jsx-a11y`                                                 | ESLint 10-compatible `eslint-plugin-jsx-a11y-x` recommended checks                                                       |
| Disabled Rules of Hooks and exhaustive dependencies                      | Both remain enabled, as approved                                                                                         |
| Backend import-extension prohibition                                     | Preserve the `.js` specifiers required by NodeNext                                                                       |
| Reference-only seeders, aliases, e2e paths, and Prisma config exclusions | Scope rules to Trading's real files; future generated Prisma output is ignored                                           |
| Invalid/deleted disabled rule names                                      | Remove them rather than retaining inert settings                                                                         |
| Named dependency-volume deletion                                         | Rebuild application images and recreate only the selected app services                                                   |

This is a reviewed port, not a claim of exact legacy preset parity. React rules without a maintained equivalent are not reimplemented as project-specific lint rules.

## Dependencies

Common tooling is declared at the workspace root; API/web plugins belong to their application. Existing compatible web declarations may resolve to the same hoisted packages.

| Location              | Packages                                                                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root dev dependencies | `eslint@10.13.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.71.2`, `globals@17.13.0`, `@stylistic/eslint-plugin@5.10.0`, `eslint-plugin-import-x@4.17.1`, `eslint-import-resolver-typescript@4.4.5` |
| API dev dependencies  | `@darraghor/eslint-plugin-nestjs-typed@7.5.8`, `eslint-plugin-n@18.5.0`, `class-validator@0.15.1`                                                                                                   |
| Web dev dependencies  | `@eslint-react/eslint-plugin@5.28.1`, `eslint-plugin-jsx-a11y-x@0.2.0`                                                                                                                              |
| Removed               | API `oxlint`; ESLint now owns API linting                                                                                                                                                           |

`class-validator` is required by the NestJS lint plugin; adding it for tooling does not introduce application request validation. No installer uses peer-dependency bypass flags.

## Commands

Use the runtime in `.node-version` first: `fnm use`. GNU Make is available on the reviewed Windows machine; the Makefile also supports POSIX environments. npm commands remain usable without Make.

| Make target                       | Action                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `make` or `make help`             | Show commands without modifying files                                            |
| `make format`                     | Explicit lint fixes and formatting in both applications                          |
| `make format-backend`             | API lint fixes and formatting                                                    |
| `make format-frontend`            | Web lint fixes and formatting                                                    |
| `make lint`                       | Read-only lint of both applications and shared tooling                           |
| `make typecheck`                  | Both TypeScript projects                                                         |
| `make build`                      | Both application builds                                                          |
| `make test`                       | Currently configured repository tests; absent web tests are not passing evidence |
| `make docker-reset-frontend-deps` | Rebuild and recreate `web`                                                       |
| `make docker-reset-backend-deps`  | Rebuild and recreate `api`                                                       |
| `make docker-reset-deps`          | Rebuild and recreate both app services                                           |

The formatting targets use each workspace's `format:all`, which runs lint fixes before Prettier. They respect the root generated-file exclusions. Make targets run sequentially even if parallel Make is requested.

Docker recovery requires the planned `compose.yaml`. Until that foundation exists, the helper fails with a clear prerequisite message before invoking Docker. Once available, recovery rebuilds without cache and recreates the selected services without dependency startup or volume deletion. No command resets PostgreSQL records.

## Verification

Verified on Node 24.17.0: `make format`, `make lint`, `make typecheck`, `make build`, `make test`, and `npm run format:check`. The existing API suite passed all three cases; frontend automated tests remain a planned infrastructure task.

In-memory lint probes confirmed rejection of explicit `any`, conditional Hooks, and missing image alt text; effective configuration enables double quotes and the NestJS provider rule. Make dry runs confirmed the formatting/recovery recipes, and the recovery helper returned its prerequisite error before invoking Docker because Compose is not implemented yet. No running Docker recovery was claimed.

## Sources

- [ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Modern React plugin migration](https://eslint-react.xyz/docs/migrating-from-eslint-plugin-react)
- [JSX accessibility plugin migration](https://github.com/eslint-community/eslint-plugin-jsx-a11y-x)
- [NestJS lint configuration](https://github.com/darraghoriordan/eslint-plugin-nestjs-typed)
