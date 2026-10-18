# Trading Web

React + Vite + TypeScript frontend. Run commands from the repository root; see [the workspace README](../../README.md).

The starter page checks `GET /api/health`. Vite proxies `/api` to NestJS during development and local preview. Set `API_PROXY_TARGET` in `.env` to change the target.

Run the component suite independently of the API and databases:

```powershell
npm run test --workspace @trading/web
```

Jest discovers `src/**/*.test.ts` and `src/**/*.test.tsx`, runs once in JSDOM, and fails if
no tests match. List the suite with `npm exec --workspace @trading/web -- jest --listTests`.
Tests use explicit `@jest/globals` imports, React Testing Library, controlled fetch requests,
and fake time. Abort-aware request doubles reject on cancellation; delayed response bodies
exercise obsolete StrictMode completions. Cleanup restores the DOM, fetch, and timers.
No running API or database is needed.

The Jest-only inline Babel transform handles TSX and CSS imports independently of Vite.
Babel does not typecheck tests: `npm run typecheck --workspace @trading/web` includes the
separate `tsconfig.test.json` project. Test-only files are excluded from the browser project.
Use `npm run build --workspace @trading/web` to verify the existing Vite production build.
JSDOM component results do not prove browser networking, Docker wiring, or source reload.
