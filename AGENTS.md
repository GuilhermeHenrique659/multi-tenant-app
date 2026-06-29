# AGENTS.md

Multi-tenant SaaS: Express 5 + TypeScript backend (`src/`), React 19 + Vite SPA (`frontend/`), Drizzle ORM on PostgreSQL.

## Commands

Backend (run from repo root):
- `npm run start:dev` — dev server (nodemon + tsx, watches `src/`, runs `src/main.ts`).
- `npm run build` — `tsc` only, emits to `dist/`.
- `npm run start` — `drizzle-kit push && node dist/main.js` (pushes schema, no migration files).
- `npm run frontend:dev` — runs the Vite dev server in `frontend/`.

Frontend (run from `frontend/`): `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint` (eslint).

## Tests

- **Runner**: Node.js built-in (`node:test` + `node:assert/strict`). Run with `npm test`.
- **Co-located**: each `*.spec.ts` sits next to the file it tests (e.g. `domain/Tenant.spec.ts` next to `domain/Tenant.ts`).
- **Fakes** implement repository interfaces for integration tests, placed next to the real repository (`repository/FakeTenantRepository.ts`).
- Application tests use the real `Mediator` + real use cases wired to fake repositories.
- Test files are excluded from `tsc` build via `"exclude": ["src/**/*.spec.ts"]` in `tsconfig.json`.

## Critical conventions

- **ESM + NodeNext**: all relative imports MUST use the `.js` extension even though the source is `.ts` (e.g. `import x from './foo.js'`). Omitting it breaks the build.
- TypeScript is strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Array/index access is `T | undefined`; handle accordingly.
- DB schema lives in `src/modules/*/db/*.ts` (per `drizzle.config.ts`). After changing schema, regenerate/apply with `drizzle-kit` (push or generate+migrate). Migrations output to `src/db/migrations/`.
- Requires `DATABASE_URL` (Postgres). `.env` is loaded via `dotenv/config` in `src/db/config.ts`. `npm run start:dev` needs a reachable Postgres; use `docker-compose up db`.

## Architecture

- **Module pattern** (`src/modules/<name>/`): `domain/` (entities), `application/` (use cases, one class each), `repository/` + `query/` (writes vs reads), `db/` (Drizzle tables), `<name>.module.ts` (orchestrator that owns DB transactions), `<name>.routes.ts` (Express `Router` factory taking a `Container`), `index.ts` (public types).
- **Domain Model pattern**: domain entities in `domain/` encapsulate business rules and invariants (e.g. `Tenant.removeMember` enforces "at least one admin must remain"). Application use cases delegate to domain methods and never duplicate those rules.
- Routes are registered in `src/modules/router.ts` and mounted under `/api<path>` in `src/main.ts`.
- **Cross-module communication** goes through `Mediator` (`@common/Mediator.ts`), not direct calls. Compensation/rollback events (`createTenantFail`, `addMemberFail`) are registered in `main.ts` to undo user creation when tenant/member ops fail.
- Module orchestrators wrap use cases in `db.transaction`, instantiating repositories per-transaction with the `tx` handle.
- `TenantRepositoryDatabase` uses an Observer change-tracking pattern: domain entity emits events, `save()` replays them as inserts/updates/deletes.

## Auth & tenancy (non-standard)

- Auth is header-based, **not JWT** (despite the `jsonwebtoken` dependency): `authenticationMiddleware` reads `x-user-id`; tenant-scoped routes read `x-tenant-id`. See `@common/Middleware.ts` and `requests` file for example calls.
- Permission strings map to roles in `@common/Permissions.ts`; `superAdminPermissionMidleware` bypasses checks for super admins.
- A super admin is created on startup from `SUPER_ADMIN_NAME` / `SUPER_ADMIN_EMAIL` env vars.
- Subdomain routing: `tenantSubdomainMiddleware` resolves a tenant from the host subdomain (test with `*.lvh.me`).

## Deploy

`docker-compose.yml` runs Postgres + the app + nginx (proxies `/api/` to app:3000). The built backend also serves `frontend/dist` as static files with SPA fallback, so build the frontend before serving in production.
