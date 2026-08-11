# AGENTS.md

Multi-tenant SaaS: Express 5 + TypeScript backend (`src/`), React 19 + Vite SPA (`frontend/`), Drizzle ORM on PostgreSQL.

Domains: **tenant** (tenants + memberships), **user** (identity + authorization), **project** (projects + tasks), **agent** (LLM-driven automation — WIP, see below).

## Workflow — mandatory for every implementation

Follow these four steps in order, for any change that implements or alters behavior. Do not skip ahead, and do not reorder them.

### 1. Ask until the requirements are fully understood

Before writing any code, interrogate the requirements. Keep asking until there is **nothing left to assume** about:

- The business rule itself — what exactly must happen, and under which conditions
- Every edge case — empty, missing, duplicated, out-of-order, concurrent, over-the-limit
- Failure behavior — what should happen when it goes wrong, and what the caller sees
- Permissions — which roles may do this, and whether the target of the action also needs checking
- Scope — what is explicitly *not* part of this change

If a design decision is not already fixed by the requirements or by existing code in this repo, **ask instead of deciding**: naming of domain concepts, where a rule lives (entity vs. domain service vs. use case), data shape, error strategy, transaction boundaries.

Do not start implementing on top of a guess. An assumption that was never confirmed is a defect waiting to happen.

### 2. Write the tests first, from the requirements

Turn each confirmed requirement and edge case into a test **before** the implementation exists:

- One test per rule and per edge case, named after the rule it proves
- `*.spec.ts` co-located with the file under test (`node:test` + `node:assert/strict`)
- Domain rules → test the entity or value object directly
- Use cases → integration test with a real Mediator, real use case, and fake repositories (add a `Fake*Repository` if the module doesn't have one yet)
- Include the failure cases, not only the happy path: invalid input, forbidden caller, violated invariant

These tests are the executable form of the requirements. If a requirement can't be expressed as a test, it isn't understood yet — go back to step 1.

### 3. Implement

Write the implementation to satisfy the tests, following the architecture and conventions in this document.

### 4. Run the tests — the task is not done until they pass

```
npm test          # from the repo root
npx tsc --noEmit  # type-check; see the `lib` caveat under Critical conventions
```

Rules:

- **Never report a change as finished without having run the suite.**
- All tests must pass — the new ones and the pre-existing ones. A regression elsewhere means the task is not done.
- If a test fails, fix the code, not the test — unless the requirement itself turns out to be wrong, in which case go back to step 1 and confirm before changing the test.
- Never delete, skip, or weaken a test to make the suite green.
- If something genuinely can't be finished, say so explicitly and state which tests are failing and why, with the actual output.

## Commands

Backend (run from repo root):
- `npm run start:dev` — dev server (nodemon + tsx, watches `src/`, runs `src/main.ts`). Needs Postgres running (`docker-compose up db`).
- `npm run build` — `tsc` emits to `dist/`.
- `npm run start` — `drizzle-kit push && node dist/main.js`.
- `npm run frontend:dev` — Vite dev server in `frontend/`.

Frontend (run from `frontend/`):
- `npm run dev` — Vite dev server (proxies `/api` → `localhost:3000`).
- `npm run build` — `tsc -b && vite build`.
- `npm run lint` — eslint.

Tests (run from root): `npm test` → `node --import tsx --test 'src/modules/**/*.spec.ts'`

## Critical conventions

- **ESM + NodeNext**: all relative imports MUST use `.js` extension even though source is `.ts` (`import x from './foo.js'`). Omitting it breaks the build.
- **Strict TypeScript**: `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Array/index access is `T | undefined`; always handle the `undefined` case.
- **`tsconfig.json` sets no `lib`**, so `target: esnext` pulls in the full DOM lib. A missing import of a DOM-colliding name (`Event`, `Response`, `Request`, `Storage`…) resolves to the DOM type **and compiles silently**. Always verify domain classes are actually imported. The `agent` aggregate used to be called `Worker`, which collided with the DOM `Worker`; `Agent` and `AgentType` do not collide, so a missing import of those is now a compile error instead of a silent bind.
- **DB schema** in `src/modules/*/db/*.ts`. Both `drizzle-kit push` (dev, used by `npm run start`) and versioned migrations in `src/db/migrations/` are in play — the migrations directory is committed and up to date through `0005`. Prefer `generate` + `migrate` when a change needs to be reproducible.
- **Env vars**: `DATABASE_URL` (required, Postgres), `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`. `.env` loaded via `dotenv/config` in `src/db/config.ts`.
- **Logging**: `src/modules/@common/Logger.ts` (winston, console transport). Use `Logger.info` / `Logger.error`, not `console.*`.

## Architecture overview

### Module pattern (`src/modules/<name>/`)

```
src/modules/<name>/
  ├── index.ts                # Public types (inputs, outputs) — module interface
  ├── <name>.module.ts        # Orchestrator — owns DB transactions, wires authorizers
  ├── <name>.routes.ts        # Express Router factory: (container: Container) => Router
  ├── UserModule.ts           # Consumer-side interface for what this module needs from `user`
  ├── application/            # Use cases — one class per operation, pure logic
  ├── domain/                 # Entities + value objects — business rules and invariants
  ├── repository/             # Repository interface + Database impl + Fake impl (tests)
  ├── query/                  # Read-only query classes (join tables, projections)
  └── db/                     # Drizzle table definitions
```

**Usage**: creating a new module? Copy this structure. See `tenant/` and `project/` for reference implementations (`project/` is the most current one).

### Route registration

1. Each module's `<name>.routes.ts` exports `(container: Container) => Router`.
2. Registered in `src/modules/router.ts` as `Map<Path, RouterHandler>`: `/users`, `/tenants`, `/projects`.
3. In `src/main.ts`, iterated and mounted at `/api<path>`:
   ```ts
   routers.forEach((routerHandler, path) => {
       app.use(`/api${path}`, routerHandler(container));
   });
   ```
4. Routes pull dependencies out of `Container` (mediator + the user-module implementations).

Handlers are plain `async` functions — Express 5 forwards rejected promises automatically, so there is no `asyncHandler` wrapper.

### Endpoints

| Method | Path | Permissions |
|---|---|---|
| `POST` | `/api/users` | public (login/check-in by email) |
| `GET` | `/api/users/search?name=` | public |
| `POST` | `/api/tenants` | super admin |
| `GET` | `/api/tenants` | authenticated (scoped per user) |
| `GET` | `/api/tenants/:id` | `tenant:details:view` |
| `POST` | `/api/tenants/:id/users` | `tenant:user:add` |
| `PATCH` | `/api/tenants/:tenantId/users/:userId` | `tenant:user:edit` |
| `DELETE` | `/api/tenants/:tenantId/users/:userId` | `tenant:user:remove` |
| `POST` | `/api/projects` | `project:create` |
| `GET` | `/api/projects` | `project:read` |
| `POST` | `/api/projects/:projectId/tasks` | `task:assign` |
| `GET` | `/api/projects/:projectId/tasks` | `task:read` |
| `GET` | `/api/projects/:projectId/tasks/:taskId` | `task:read` |
| `PATCH` | `/api/projects/:projectId/tasks/:taskId` | `task:update` |
| `PATCH` | `/api/projects/:projectId/tasks/:taskId/assign` | `task:assign` |

All non-public routes require the `x-user-id` header; tenant-scoped ones also require `x-tenant-id`.

### Authorization: the Authorizer decorator pattern

This is the **current** authorization mechanism. Permissions are enforced in the application layer, not in middleware.

1. A use case implements `AuthorizerApplicationService<I extends AuthorizedInput, O>` (`@common/AuthorizerApplicationService.ts`), so its input always carries `{ userId, tenantId }`.
2. The orchestrator wraps it: `this._userModule.authorizer(useCase, ['task:update'])`.
3. `AuthorizerDecorator` (`user/application/AuthorizerDecorator.ts`) resolves the user's role for that tenant via `UserQuery`, checks it against the `Permissions` map, and throws `Error('Forbidden')` before delegating.
4. For system-wide operations, use `superAdminAuthorizer(useCase)` with `SuperAdminAuthorizerApplicationService<I extends SuperAdminInput, O>` — checks `isSuperAdmin` only.

```ts
public async updateTask(input: UpdateTaskRequest) {
    return this._db.transaction(async (tx) => {
        const taskRepository = new TaskRepositoryDatabase(tx);
        const updateTask = new UpdateTask(taskRepository);
        const authorizer = this._userModule.authorizer(updateTask, ['task:update']);

        return await authorizer.execute(input);
    });
}
```

Routes therefore only apply `authenticationMiddleware` (which validates `x-user-id`) and pass headers straight into the module.

> `permssionMiddleware`, `superAdminPermissionMidleware` and `tenantSubdomainMiddleware` in `@common/Middleware.ts` are **leftovers** from the previous design and are no longer wired to any route. Subdomain-based tenant resolution is currently inactive even though nginx and `docker-compose` still support it. Don't add new routes using them — use the authorizer decorator.

### Cross-module dependencies: consumer-defined `UserModule` interfaces

Modules never import each other's internals. Two mechanisms exist, for different purposes:

**1. Consumer-defined interface (for synchronous queries + authorization)**

The *consuming* module declares what it needs and a container key:

```ts
// src/modules/project/UserModule.ts
export const ProjectUserModuleKey = "ProjectUserModule";

export interface ProjectUserModule {
    getUser(userId: string, tenantId: string): Promise<UserTask | null>;
    authorizer<I extends AuthorizedInput, O>(service: AuthorizerApplicationService<I, O>, permissions: Array<string>): AuthorizerApplicationService<I, O>;
    superAdminAuthorizer<I extends SuperAdminInput, O>(service: SuperAdminAuthorizerApplicationService<I, O>): SuperAdminAuthorizerApplicationService<I, O>;
    hasPermissions(userId: string, tenantId: string, permissions: Array<string>): Promise<boolean>;
}
```

`UserModuleImpl` implements every consumer interface (`implements ProjectUserModule, TenantUserModule`), and `main.ts` registers the same instance under each key. The consumer receives it through the `Container` and depends only on its own narrow interface.

**2. Mediator (for events and compensating actions)**

`@common/Mediator.ts` — typed pub/sub with `register(event, handler)` / `notify(event, input)`. Events registered in `main.ts`:
- `checkInUser` → user module finds/creates a user
- `createTenantFail` → rollback: remove user if tenant creation fails
- `addMemberFail` → rollback: remove user if addMember fails

**Which to use**: need a value back synchronously, or authorization? Consumer-defined interface. Need fire-and-forget notification or a rollback/compensation hook? Mediator.

### Database transaction pattern (orchestrator)

- Only the orchestrator (`<name>.module.ts`) creates transactions.
- Use cases are pure logic + repository calls — they never touch `db` directly.
- Inside the transaction, a new repo is created with the `tx` handle.
- Read-only operations backed by a `query/` class skip the transaction entirely (see `ProjectModule.listProjects`).

`ProjectModule` and `UserModuleImpl` follow this. **`TenantModuleImpl` does not** — it passes the shared `db` handle into its repositories, so its writes aren't atomic and depend on the mediator rollbacks. Wrap new tenant operations in `this._db.transaction(...)`.

### Observer / change-tracking

- **Files**: `Observer.ts`, `ChangeTrackingObserver.ts` in `@common/`.
- Aggregate roots extend `Subject` and subscribe a `ChangeTrackingObserver` in their constructor; factory methods emit an event (`notify({ event: "projectCreated", data })`).
- `*RepositoryDatabase.save()` retrieves the tracker via `findObserver()` and branches: creation event present → INSERT; otherwise → UPDATE of the mutable columns.
- `TenantRepositoryDatabase` uses the richer form: it replays the recorded events as precise INSERT/UPDATE/DELETE for the memberships inside the aggregate.
- Only use this for aggregate roots that need partial diff saves.

### Repository interface pattern

```ts
interface TaskRepository {
    save(task: Task): Promise<void>;
    has(criteria: BaseCriteria): Promise<boolean>;
    get(criteria: BaseCriteria): Promise<Task | null>;
}
```

Implementations per module:
- **Interface** — contract for the module.
- **`Database`** — real Drizzle implementation.
- **`Fake`** — in-memory Map for tests, co-located next to the real impl. Present for `tenant/` and `user/`; `project/` has none yet, which is why its use cases are untested.

### Criteria / specification pattern

- **BaseCriteria** (`Criteria.ts`) holds `{ key, value, op }[]`.
- Each module extends with fluent builders: `TenantCriteria.id()`, `UserCriteria.email()`, `ProjectCriteria.getById().getByTenantId()`.
- `DrizzleCriteriaApply()` converts to a Drizzle `and(...)` condition.
- **Extend** `DrizzleCriteriaApply` when adding new operators (currently supports `eq`, `gt`).

### Container / DI

- **File**: `src/modules/@common/Container.ts` — `Map<string, any>` with `register(key, value)` / `get<T>(key)` (throws if missing).
- Registered in `main.ts`: `'mediator'`, `ProjectUserModuleKey`, `TenantUserModuleKey`.

### Auth & tenancy

- **Header-based auth** (not JWT): `authenticationMiddleware` reads `x-user-id`, loads the user via `UserQuery`, attaches it to `req.user`.
- **Tenant scoping**: routes read `x-tenant-id` and pass it into the module input, where the authorizer resolves the role from `membership`.
- **`jsonwebtoken` is installed but unused** — `Login` still returns a plain `{ userId, name, isSuperAdmin }` with a `// TODO: ADD JWT TOKEN`.
- **Permissions** (`@common/Permissions.ts`): `Map<string, string[]>` mapping permission → allowed roles (`admin`, `member`):
  - tenant: `tenant:user:read`, `tenant:user:add`, `tenant:user:remove`, `tenant:user:edit`, `tenant:details:view`, `tenant:list`, `tenant:read`
  - project: `project:create` (admin), `project:read`
  - task: `task:assign` (admin), `task:update`, `task:read`
- **Super admin bypass**: handled inside `superAdminAuthorizer` / `UserModuleImpl.isSuperAdmin`. A super admin is seeded on boot from `SUPER_ADMIN_NAME` / `SUPER_ADMIN_EMAIL`.
- **Domain-level permission check**: `TaskService.assignUser` re-checks the assignee's role against `task:update` / `task:read` before assignment — a user can only be assigned work they'd be allowed to do.
- **Frontend auth**: login posts to `/api/users`, stores `{ userId, name, isSuperAdmin }` in `localStorage`; `FetchHttpClient` auto-attaches `x-user-id`, and gateways add `x-tenant-id` per call.

### `agent/` module — work in progress

An LLM-driven automation module, **not yet wired to any route, container key, or table**. Current shape:

- `domain/Agent.ts` — aggregate holding a `StepCollection`; `AgentType` is `scheduler | view | once`.
- `domain/Step.ts` — `{ action, input, order, type, status }`; `StepType` is `ACTION | ASK`, `StepStatus` is `pending | running | completed | failed`.
- `domain/AllowModules.ts` — whitelist of actions the LLM may call (`createProject`, `createTask`, `updateTask`, `assignTask`) with input/output shapes and required roles.
- `gateway/LLMGateway.ts`, `repository/AgentRepository.ts` — interfaces only.
- `application/CreateAgent.ts` — `execute()` is empty.

Known gaps in this module: `Agent.ts` doesn't import `AgentType` and `AgentRepository.ts` doesn't import `Agent` (both silently bind to DOM globals — see the `lib` note under Critical conventions); neither `Agent` nor `CreateAgent` is exported. Fix those before building on top of it.

## Frontend architecture

```
frontend/src/
  ├── main.tsx                       # Entry point
  ├── App.tsx                        # createBrowserRouter
  ├── components/
  │   ├── ProtectedRoute.tsx         # Checks localStorage for 'user'
  │   ├── ProjectsNavBar.tsx         # Project switcher + create
  │   ├── TaskList.tsx               # Tasks of the selected project
  │   └── TaskModal.tsx              # Create/edit task, assign member
  ├── pages/
  │   ├── Login.tsx                  # Email form → POST /api/users
  │   ├── Home.tsx                   # Tenant list + member management modals
  │   └── Projects.tsx               # Projects + tasks board for a tenant
  ├── hook/
  │   ├── useForm.ts                 # Local form state helper
  │   ├── useTenants.ts              # useTenant(s) / useTenantActions
  │   └── useProjects.ts             # useProject(s) / useTasksByProject / *Actions
  ├── gateway/                       # API abstraction
  │   ├── HttpClient.ts              # Interface (get/post/put/patch/delete → Result<T,E>)
  │   ├── FetchHttpClient.ts         # fetch impl, auto-attaches x-user-id
  │   ├── tenant/                    # TenantGateway + TenantHttpGateway
  │   ├── user/                      # UserGateway + UserHttpGateway
  │   └── project/                   # ProjectGateway + ProjectHttpGateway
  ├── model/
  │   ├── User.ts                    # Zod schema + factories
  │   ├── Tenant.ts                  # Zod schema + AddUser/RemoveUser + tenantsStore
  │   ├── Project.ts                 # Zod schema + projectsStore
  │   ├── Task.ts                    # Zod schema + UpdateStatus/SetDueDate/AssignTo + tasksStore
  │   └── common/
  │       ├── Storage.ts             # createStore<T> minimal observable store
  │       ├── Collection.ts          # ModelCollection<K,V> Map wrapper
  │       └── Model.ts               # (empty placeholder)
  ├── application/
  │   ├── tenant/                    # AddMember, RemoveMember
  │   └── project/                   # CreateProject, ListProjects, AddTask, ListTasks, GetTask, UpdateTask, AssignTask
  └── util/
      ├── Result.ts                  # Result<T,E> monad (Ok/Error) + unwrapOr/unwrapOrElse
      └── ArrayUtil.ts               # ModelToMapFn and Array → Map helpers
```

**Routing**: React Router DOM 7 — `/` (Home), `/tenants/:tenantId/projects` (Projects), `/login`.

**State**: custom `createStore<T>()` (no Redux/Zustand) — minimal observable store read through `useSyncExternalStore`. One store per model (`tenantsStore`, `projectsStore`, `tasksStore`), each wrapping a `ModelCollection`.

**Models are immutable data + free functions**, not classes: a model is `Readonly<{ props }>`, mutations are pure functions returning a new value (`UpdateStatus(task, 'done')`), and validation-capable ones return `Result<T, Error>`.

**Use cases are curried factories**, not classes: `export const AddTask = (deps) => async (input) => Result<...>`. Instantiate at the call site with the gateway, e.g. `AddTask({ projectGateway })({ tenantId, projectId, name })`.

**API layer**: gateway pattern — interfaces in `gateway/`, impl in `*HttpGateway.ts`. Every method returns `Result<T, Error>`; HTTP gateways parse responses through the model's `From()` so invalid payloads are dropped instead of crashing.

**Guidelines for new features**:
- Add a Zod schema + factories to `model/` (and a store if it's shared state).
- Add a gateway interface + HTTP implementation.
- Add a curried use case in `application/` for orchestration.
- Read state via a hook in `hook/`; use `useState` only for genuinely local UI state.

> `frontend/src/model/*.ts` import `zod`, but `zod` is not listed in `frontend/package.json` — it currently resolves only because it's a root dependency. Add it to the frontend package before relying on a clean install there.

## Database schema

Table names are inconsistent by design history: `user`, `tenant`, `membership` are singular; `projects`, `tasks` are plural.

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

### Table: `projects`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `varchar` | PK |
| `name` | `varchar` | NOT NULL |
| `status` | `varchar` | NOT NULL (`active` \| `closed`) |
| `tenant_id` | `varchar` | NOT NULL, FK → tenant.id |
| `created_at` | `timestamp` | NOT NULL |

### Table: `tasks`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `varchar` | PK |
| `name` | `varchar` | NOT NULL |
| `status` | `varchar` | NOT NULL (`screen` \| `working` \| `review` \| `done`) |
| `start_at` | `timestamp` | nullable |
| `end_at` | `timestamp` | nullable |
| `project_id` | `varchar` | NOT NULL, FK → projects.id |
| `assignee_id` | `varchar` | nullable, FK → user.id |
| `created_at` | `timestamp` | NOT NULL |

**Relationships**: Tenant 1—* Membership *—1 User (many-to-many with role payload). Tenant 1—* Project 1—* Task, Task *—1 User (assignee). No cascading deletes in Drizzle — the application handles cleanup.

## Testing

Tests come **before** the implementation — see [Workflow](#workflow--mandatory-for-every-implementation).

- **Runner**: Node.js built-in (`node:test` + `node:assert/strict`). Run with `npm test`.
- **Co-located**: `*.spec.ts` next to the file it tests.
- **Fakes**: `Fake*Repository.ts` next to the real repository — same interface, in-memory `Map`.
- **Integration tests**: real Mediator + real use cases + fake repositories.
- **Domain tests**: test entities directly (e.g. `Tenant.spec.ts` covers invariants like "last admin cannot be removed").
- Test files are excluded from the `tsc` build via `tsconfig.json` `exclude`.
- **Coverage gaps**: `project/` and `agent/` have no tests, and `project/` has no fake repositories. Add both when touching those modules.

## Docker & deploy

- **`docker-compose.yml`**: Postgres 15 + app (Node 24) + nginx (proxies `/api/` → app:3000, incl. wildcard subdomains).
- **`Dockerfile`**: single stage, `npm install && npm run build`, serves on port 3000.
- **Production**: the backend serves `frontend/dist` as static files with an SPA fallback (`/*splat`). Build the frontend first.
- **Env for docker**: `DATABASE_URL=postgres://user:password@db:5432/tenant_db`.
- **`requests`** at the repo root is a scratchpad of raw HTTP requests for manual testing (`*.lvh.me:3000` resolves to localhost for subdomain checks).

## Quick reference: adding a new module

1. Create `src/modules/<name>/` with the standard subdirectories.
2. Define Drizzle table(s) in `db/`.
3. Create domain entities/value objects in `domain/` with the business rules.
4. Create the repository interface in `repository/`, then `*RepositoryDatabase` and `Fake*Repository`.
5. Create use cases in `application/`, each implementing `AuthorizerApplicationService<I, O>` (one class per operation).
6. If the module needs anything from `user`, declare a `UserModule.ts` interface + container key in *your* module.
7. Create `<name>.module.ts` — wrap each use case in `db.transaction(...)` and in `userModule.authorizer(useCase, [permissions])`.
8. Add the new permission strings to `@common/Permissions.ts`.
9. Create `<name>.routes.ts` — `authenticationMiddleware` + header extraction, delegate to the module.
10. Register routes in `router.ts`; register the module's container key in `main.ts`.
11. Register any Mediator events/rollbacks in `main.ts`.
12. Add public input/output types in `index.ts`.
13. Add frontend: Zod model + store → gateway → curried use case → hook → page.
14. Test: `*.spec.ts` co-located, `npm test`.

## Known issues

Documented so they aren't mistaken for intended behavior:

- **`src/main.ts`**: the error-handling middleware is registered *before* the routers, so it never catches route errors. Use-case errors (`Forbidden`, `Project not found`) surface as Express's default HTML 500 instead of the intended JSON 400.
- **`agent/`**: missing imports bind to DOM globals; classes not exported (see the module section above).
- **`frontend/package.json`**: missing the `zod` dependency.
- **`TaskRepositoryDatabase.save()`**: the INSERT branch omits `assigneeId`, `startAt` and `endAt`, so a task created already assigned loses its assignee.
- **`Task.changeStatus()`**: the "due date required to finish" guard is inverted — it throws when `endAt` *is* set.
- **`DueDate.create()`**: compares `getDate()` (day of month only), so ranges crossing a month boundary validate incorrectly.
- **Dead code**: `user/application/UserAuthorizer.ts` (superseded by `AuthorizerDecorator`), and the three unused middlewares in `@common/Middleware.ts`.
- **`getHeader()`** is duplicated in `tenant.routes.ts` and `project.routes.ts` — belongs in `@common/`.
