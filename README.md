# Forex AI Trade Assistant

An npm workspace with a NestJS backend and a React + Vite frontend, both using TypeScript.

## Requirements

Use Node.js **24.17.0** (pinned in `.node-version`) and npm 10 or newer. With the existing `fnm` installation:

```powershell
fnm use
```

If that version is not installed on a new machine, run `fnm install` first. Node 23 is not supported by the current NestJS CLI dependencies.

## Start development

Run from the repository root:

```powershell
npm install
npm run dev
```

| App                  | Address                          |
| -------------------- | -------------------------------- |
| Frontend             | http://localhost:5173            |
| Backend health check | http://localhost:3000/api/health |

Both apps reload when their source changes. The frontend checks the backend connection through Vite's `/api` proxy. Click **Check again** if the initial check runs before the backend finishes starting. Press Ctrl+C to stop both apps.

## Configuration

Defaults work without environment files. To customize them:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

| File            | Variable           | Default                 | Purpose                                       |
| --------------- | ------------------ | ----------------------- | --------------------------------------------- |
| `apps/api/.env` | `PORT`             | `3000`                  | Backend listening port                        |
| `apps/api/.env` | `CORS_ORIGIN`      | `http://localhost:5173` | Allowed browser origin for direct API calls   |
| `apps/web/.env` | `API_PROXY_TARGET` | `http://localhost:3000` | Backend target for the Vite dev/preview proxy |

Restart the relevant app after editing its environment. If the backend port changes, update `API_PROXY_TARGET` too. Keep secrets in backend environment variables; Vite variables prefixed with `VITE_` are public browser values.

## Workspace

```text
apps/
  api/       NestJS API, configuration, health module and API tests
  web/       React + Vite frontend
docs/
  openapi.yaml
FOREX_AI_PRD.md
```

The [PRD](FOREX_AI_PRD.md) describes the product roadmap. This setup implements the application foundation and API liveness check.

## Commands

ESLint 10 checks both applications using the compatible EduPilot rules port. Run `make help` for formatting, lint, typecheck, build, test, and Docker recovery targets. `make format` applies lint fixes and formatting; `make lint` is read-only. See [ESLint and Makefile adoption](docs/eslint-adoption.md) for rule differences, dependencies, and recovery behavior. Docker recovery targets require the planned Compose foundation and preserve database volumes.

| Command                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start both apps                                 |
| `npm run dev:api`      | Start only the backend in watch mode            |
| `npm run dev:web`      | Start only the frontend                         |
| `npm run build`        | Build both apps                                 |
| `npm run lint`         | Lint both apps                                  |
| `npm run typecheck`    | Type-check both apps                            |
| `npm test`             | Run API tests, including HTTP integration tests |
| `npm run test:e2e`     | Run only the API HTTP integration suite         |
| `npm run format`       | Format workspace files                          |
| `npm run format:check` | Check formatting                                |

After the first installation, use `npm ci` to reproduce the versions in the root lockfile. Add dependencies to the correct app with `npm install <package> --workspace @trading/api` or `--workspace @trading/web`.

## API contract

The initial contract is in [docs/openapi.yaml](docs/openapi.yaml):

```http
GET /api/health
```

```json
{ "status": "ok", "service": "trading-api" }
```

This unauthenticated endpoint checks API liveness only. API tests cover the response contract, route prefix and configured CORS origin. With the installed Postman CLI, check the running backend locally using:

```powershell
postman request http://localhost:3000/api/health --no-report-events
```

## Production builds

```powershell
npm run build
npm run start:api
```

The compiled backend is in `apps/api/dist`; the frontend static files are in `apps/web/dist`. For a local check of the built frontend, run `npm run preview:web` in another terminal and open http://localhost:4173 while the backend is running.

For deployment, serve the frontend static files with a web server and forward `/api` on the same origin to NestJS. Vite's proxy is for development and preview; it is not included in the static build. [NestJS setup reference](https://docs.nestjs.com/first-steps) · [Vite proxy reference](https://vite.dev/config/server-options.html#server-proxy).
