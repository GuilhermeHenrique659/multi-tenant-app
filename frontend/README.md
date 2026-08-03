# Frontend

React 19 + TypeScript SPA (Vite 8) for the multi-tenant app. Talks to the Express backend under `/api`.

## Running

From this directory:

- `npm run dev` — Vite dev server; proxies `/api` → `http://localhost:3000`, so the backend must be running (`npm run start:dev` at the repo root).
- `npm run build` — `tsc -b && vite build` → `dist/`
- `npm run preview` — serve the production build
- `npm run lint` — eslint

In production the backend serves `dist/` as static files with an SPA fallback, so build the frontend before building the Docker image.

> Note: `src/model/*.ts` import `zod`, but `zod` is not listed in this package's dependencies — it currently resolves only because it is a dependency of the root package. Add it here before relying on a clean install in this directory.

## Routes

| Path | Page | Access |
|---|---|---|
| `/login` | `pages/Login.tsx` | public |
| `/` | `pages/Home.tsx` — tenant list + member management | protected |
| `/tenants/:tenantId/projects` | `pages/Projects.tsx` — projects + task board | protected |

`components/ProtectedRoute.tsx` gates the protected routes on a `user` entry in `localStorage`.

## Authentication

Login posts the email to `POST /api/users` and stores `{ userId, name, isSuperAdmin }` in `localStorage` under `user`. `FetchHttpClient` reads it and attaches the `x-user-id` header to every request; gateways add `x-tenant-id` per call for tenant-scoped endpoints. There is no token yet — the backend authenticates by header.

## Layout

```
src/
├── main.tsx                       # Entry point
├── App.tsx                        # createBrowserRouter
├── components/
│   ├── ProtectedRoute.tsx
│   ├── ProjectsNavBar.tsx         # Project switcher + create
│   ├── TaskList.tsx
│   └── TaskModal.tsx              # Create/edit task, assign member
├── pages/                         # Login, Home, Projects
├── hook/
│   ├── useForm.ts                 # Local form state helper
│   ├── useTenants.ts              # useTenant(s) / useTenantActions
│   └── useProjects.ts             # useProject(s) / useTasksByProject / *Actions
├── gateway/
│   ├── HttpClient.ts              # Interface: get/post/put/patch/delete → Result<T,E>
│   ├── FetchHttpClient.ts         # fetch impl, attaches x-user-id
│   ├── tenant/  user/  project/   # One interface + one HTTP impl each
├── model/
│   ├── User.ts  Tenant.ts  Project.ts  Task.ts
│   └── common/
│       ├── Storage.ts             # createStore<T> observable store
│       ├── Collection.ts          # ModelCollection<K,V> Map wrapper
│       └── Model.ts               # (empty placeholder)
├── application/
│   ├── tenant/                    # AddMember, RemoveMember
│   └── project/                   # CreateProject, ListProjects, AddTask,
│                                  # ListTasks, GetTask, UpdateTask, AssignTask
└── util/
    ├── Result.ts                  # Result<T,E> monad + unwrapOr/unwrapOrElse
    └── ArrayUtil.ts               # ModelToMapFn and Array → Map helpers
```

## Conventions

The SPA mirrors the backend's layering, in a functional style. Four rules cover most of it:

**1. Models are immutable data + free functions, not classes.**

A model is a Zod schema plus `Readonly<{ props }>`. Mutations are pure functions that return a new value, and the ones that can fail return a `Result`:

```ts
const updated = UpdateStatus(task, 'done');   // Result<Task, Error>
```

`Create(data)` throws on invalid input; `From(data)` returns `null`. HTTP gateways use `From()` so a malformed payload is dropped instead of crashing a render.

**2. Use cases are curried factories, not classes.**

```ts
export const AddTask = (deps: { projectGateway: ProjectGateway }) =>
    async (input: AddTaskInput): Promise<Result<Task, Error>> => { ... }

// at the call site
const addTask = AddTask({ projectGateway: new ProjectHttpGateway(new FetchHttpClient()) });
```

**3. Errors are values.** Everything that can fail returns `Result<T, Error>` from `util/Result.ts` — no exceptions across layers. Use `isOk()` / `isErr()`, `unwrap()`, or the `unwrapOr` / `unwrapOrElse` helpers.

**4. Shared state lives in a store, not in `useState`.** Each model owns a `createStore` instance wrapping a `ModelCollection` (`tenantsStore`, `projectsStore`, `tasksStore`), read through the hooks in `hook/` (which wrap `useSyncExternalStore`). No Redux, no Zustand. `useState` is for genuinely local UI state only — open modals, selected ids, form drafts.

## Adding a feature

1. Zod schema + factories in `model/` (plus a store if the state is shared)
2. Gateway interface + `*HttpGateway` implementation in `gateway/`
3. Curried use case in `application/`
4. Selector/action hook in `hook/`
5. Page or component that composes them
