# AGENTS.md

Multi-tenant SaaS: Express 5 + TypeScript backend (`src/`), React 19 + Vite SPA (`frontend/`), Drizzle ORM on PostgreSQL.

## Commands

Backend (run from repo root):
- `npm run start:dev` — dev server (nodemon + tsx, watches `src/`, runs `src/main.ts`). Needs Postgres running (`docker-compose up db`).
- `npm run build` — `tsc` emits to `dist/`.
- `npm run start` — `drizzle-kit push && node dist/main.js` (pushes schema, no migration files).
- `npm run frontend:dev` — Vite dev server in `frontend/`.

Frontend (run from `frontend/`):
- `npm run dev` — Vite dev server (proxies `/api` → `localhost:3000`).
- `npm run build` — `tsc -b && vite build`.
- `npm run lint` — eslint.

Tests (run from root): `npm test` → `node --import tsx --test 'src/modules/**/*.spec.ts'`

## Critical conventions

- **ESM + NodeNext**: all relative imports MUST use `.js` extension even though source is `.ts` (`import x from './foo.js'`). Omitting it breaks the build.
- **Strict TypeScript**: `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Array/index access is `T | undefined`; always handle the `undefined` case.
- **DB schema** in `src/modules/*/db/*.ts`. After changes, run `drizzle-kit push` (dev) or `generate + migrate` (prod). Migrations output to `src/db/migrations/`.
- **Env vars**: `DATABASE_URL` (required, Postgres), `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`. `.env` loaded via `dotenv/config` in `src/db/config.ts`.

## Architecture overview

### Module pattern (`src/modules/<name>/`)

```
src/modules/<name>/
  ├── index.ts                # Public types (inputs, outputs) — module interface
  ├── <name>.module.ts        # Orchestrator — owns DB transactions, instantiates repos per-tx
  ├── <name>.routes.ts        # Express Router factory: (container: Container) => Router
  ├── application/            # Use cases — one class per operation, pure logic
  ├── domain/                 # Entities — encapsulate business rules and invariants
  ├── repository/             # Repository interface + Database impl + Fake impl (tests)
  ├── query/                  # Read-only query classes (join tables, projections)
  └── db/                     # Drizzle table definitions
```

**Usage**: creating a new module? Copy this entire structure. Each layer has a single responsibility. See existing modules (`tenant/`, `user/`) for reference implementations.

### Route registration

1. Each module's `<name>.routes.ts` exports `(container: Container) => Router`.
2. Registered in `src/modules/router.ts` as `Map<Path, RouterHandler>`.
3. In `src/main.ts`, iterated and mounted at `/api<path>`:
   ```ts
   routers.forEach((routerHandler, path) => {
       app.use(`/api${path}`, routerHandler(container));
   });
   ```
4. Routes get dependencies from `Container` (currently only `mediator`).

### Database transaction pattern (orchestrator)

- Only the orchestrator (`<name>.module.ts`) creates transactions.
- Use cases are pure logic + repository calls — they never touch `db` directly.
- Inside the transaction, a new repo is created with the `tx` handle:

```ts
async createTenant(input: CreateTenantInput) {
    return this._db.transaction(async (tx) => {
        const repo = new TenantRepositoryDatabase(tx);
        const useCase = new CreateTenant(repo, this._mediator);
        return await useCase.execute(input);
    });
}
```

### Mediator pattern (cross-module communication)

- **File**: `src/modules/@common/Mediator.ts`
- Simple typed pub/sub: `register(event, handler)` and `notify(event, input)`.
- **Never call another module directly** — always go through the Mediator.
- Events registered in `main.ts`:
  - `checkInUser` → user module finds/creates user
  - `createTenantFail` → rollback: remove user if tenant creation fails
  - `addMemberFail` → rollback: remove user if addMember fails

**Pattern for any new cross-module dependency**:
1. Define event name as a string constant.
2. Register handler in `main.ts`.
3. Call `mediator.notify(eventName, payload)` from use case.
4. Register compensation/rollback event handlers for failure cases.

### Observer / change-tracking (TenantRepositoryDatabase)

- **Files**: `Observer.ts`, `Subject.ts` in `@common/`, `TenantRepositoryDatabase.ts`
- Domain entity (`Tenant extends Subject`) emits events on mutations.
- When `get()` is called, a `ChangeTrackingObserver` subscribes to the entity.
- When `save()` is called, it replays events as precise Drizzle INSERT/UPDATE/DELETE.
- **Only use this pattern for aggregate roots** that need partial diff saves.

### Repository interface pattern

```ts
interface TenantRepository {
    save(tenant: Tenant): Promise<void>;
    has(criteria: TenantCriteria): Promise<boolean>;
    get(criteria: TenantCriteria): Promise<Tenant | undefined>;
}
```

Three implementations per module:
- **Interface** — contract for the module.
- **`Database`** — real Drizzle implementation.
- **`Fake`** — in-memory Map for tests (co-located next to real impl).

### Criteria / specification pattern

- **BaseCriteria** (`Criteria.ts`) holds `{ key, value, op }[]`.
- Each module extends with fluent builders: `TenantCriteria.id()`, `UserCriteria.email()`.
- `DrizzleCriteriaApply()` converts to Drizzle `and(...)` condition.
- **Extend** `DrizzleCriteriaApply` when adding new operators (currently supports `eq`, `gt`).

### Container / DI

- **File**: `src/modules/@common/Container.ts`
- Simple `Map<string, any>` with `register(key, value)` and `get<T>(key)`.
- Currently only holds the mediator. Expand by registering new services in `main.ts`.

### Auth & tenancy (non-standard)

- **Header-based auth** (not JWT): `authenticationMiddleware` reads `x-user-id` header, loads user via `UserQuery`.
- **Tenant scoping**: tenant routes read `x-tenant-id` header.
- **Permissions** (`Permissions.ts`): `Map<string, string[]>` mapping permission strings to allowed roles:
  - `tenant:user:read`, `tenant:user:add`, `tenant:user:remove`, `tenant:user:edit`, `tenant:details:view`, `tenant:list`, `tenant:read`
- **Super admin bypass**: `superAdminPermissionMidleware` (note: 3× 's') skips checks for super admins.
- **Subdomain routing**: `tenantSubdomainMiddleware` parses subdomain from host header (test with `*.lvh.me:3000`).
- **Frontend auth**: login creates user via `POST /api/users`, stores `{ userId, name, isSuperAdmin }` in `localStorage`. `FetchHttpClient` auto-attaches `x-user-id`.

### Middleware chain for protected routes

```ts
router.patch(
    '/:tenantId/users/:userId',
    authenticationMiddleware,
    tenantSubdomainMiddleware,
    superAdminPermissionMidleware,
    permssionMiddleware('tenant:user:edit'),
    asyncHandler(async (req, res) => { ... })
);
```

## Frontend architecture

```
frontend/src/
  ├── main.tsx                    # Entry point
  ├── App.tsx                     # createBrowserRouter with / and /login
  ├── components/ProtectedRoute.tsx  # Checks localStorage for 'user'
  ├── pages/
  │   ├── Login.tsx               # Email form → POST /api/users
  │   └── Home.tsx                # Tenant list + member management modals
  ├── gateway/                    # API abstraction
  │   ├── HttpClient.ts           # Interface (get/post/put/delete returning Result<T,E>)
  │   ├── FetchHttpClient.ts      # fetch impl, auto-attaches x-user-id
  │   ├── tenant/                 # TenantGateway + TenantHttpGateway
  │   └── user/                   # UserGateway + UserHttpGateway
  ├── model/
  │   ├── User.ts                 # Zod schema + factories
  │   ├── Tenant.ts               # Zod schema + tenantsStore (custom store)
  │   └── common/
  │       ├── Storage.ts          # createStore<T> minimal observable store
  │       └── Collection.ts       # ModelCollection<K,V> Map wrapper
  ├── application/tenant/         # Use cases: AddMember, RemoveMember
  └── util/
      ├── Result.ts               # Result<T,E> monad (Ok/Error)
      └── ArrayUtil.ts            # Array → Map helpers
```

**Routing**: React Router DOM 7 — `createBrowserRouter` with paths `/` and `/login`.

**State**: Custom `createStore<T>()` (no Redux/Zustand) — minimal observable store using `useSyncExternalStore`.

**API layer**: Gateway pattern — interfaces in `gateway/`, impl in `*HttpGateway.ts`. `FetchHttpClient` returns `Result<T, Error>` for structured error handling.

**Guidelines for new features**:
- Add Zod schemas to `model/` for validation.
- Add gateway interface + HTTP implementation.
- Add use cases in `application/` for orchestration.
- Use `Storage.ts` stores for state, never raw `useState` for shared data.

## Database schema

### Table: `user`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `varchar` | PK |
| `name` | `varchar` | NOT NULL |
| `email` | `varchar` | NOT NULL, UNIQUE |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `is_super_admin` | `boolean` | NOT NULL, default `false` |
| `created_at` | `timestamp` | NOT NULL |

### Table: `tenant`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `varchar` | PK |
| `name` | `varchar` | NOT NULL |
| `subdomain` | `varchar` | NOT NULL, UNIQUE |
| `max_number_of_members` | `integer` | NOT NULL, default `0` |
| `created_at` | `timestamp` | NOT NULL |

### Table: `membership`
| Column | Type | Constraints |
|--------|------|-------------|
| `tenant_id` | `varchar` | NOT NULL, FK → tenant.id (composite PK) |
| `user_id` | `varchar` | NOT NULL, FK → user.id (composite PK) |
| `role` | `varchar` | NOT NULL |

**Relationships**: Tenant 1---* Membership, User 1---* Membership (many-to-many with role payload). No cascading deletes in Drizzle — application handles cleanup.

## Testing

- **Runner**: Node.js built-in (`node:test` + `node:assert/strict`). Run with `npm test`.
- **Co-located**: `*.spec.ts` next to the file it tests.
- **Fakes**: `Fake*Repository.ts` next to the real repository — implement the same interface with an in-memory `Map`.
- **Integration tests**: real Mediator + real use cases + fake repositories.
- **Domain tests**: test entities directly (e.g., `Tenant.spec.ts` tests invariants like "last admin cannot be removed").
- Test files excluded from `tsc` build via `tsconfig.json` `exclude`.

## Docker & deploy

- **`docker-compose.yml`**: Postgres 15 + app (Node 24) + nginx (proxies `/api/` → app:3000).
- **`Dockerfile`**: single stage, `npm install && npm run build`, serves on port 3000.
- **Production**: backend serves `frontend/dist` as static files with SPA fallback. Build frontend first.
- **Env for docker**: `DATABASE_URL=postgres://user:password@db:5432/tenant_db`.

## Quick reference: adding a new module

1. Create `src/modules/<name>/` with the standard subdirectories.
2. Define Drizzle table(s) in `db/`.
3. Create domain entity/entities in `domain/` with business rules.
4. Create repository interface in `repository/`.
5. Implement `*RepositoryDatabase` with Drizzle queries.
6. Create `Fake*Repository` for testing.
7. Create use cases in `application/` (one class per operation).
8. Create `<name>.module.ts` — orchestrator wrapping use cases in `db.transaction(...)`.
9. Create `<name>.routes.ts` — Express Router with middleware chain.
10. Register routes in `router.ts`.
11. Register any new Mediator events in `main.ts`.
12. Add public types in `index.ts`.
13. Add frontend: Zod model → gateway → pages.
14. Test: `*.spec.ts` co-located, `npm test`.
