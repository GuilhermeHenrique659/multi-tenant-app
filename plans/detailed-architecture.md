# Detailed System Architecture Documentation

## Overview

This document provides a comprehensive overview of the system architecture, focusing on modularity, communication patterns, and data handling principles. The architecture follows Domain-Driven Design (DDD) principles with a clear separation of concerns between modules.

## 1. Modular Architecture

The system is built using a modular architecture where each module represents a distinct business capability:

### Module Principles

1. **Module Isolation**: modules must not reach into another module's internals (domain, repositories, tables)
2. **Interface Exposure**: each module exposes its functionality through a well-defined interface
3. **Consumer-Defined Contracts**: when a module needs something from another module, *it* declares the interface it requires
4. **Decoupled Events**: notifications and compensating actions travel through the mediator
5. **Single Responsibility**: each module focuses on a specific business domain

### Current Modules

- **Tenant Module**: manages tenant creation, membership, and tenant-specific operations
- **User Module**: handles user identity, check-in/login, and — as a cross-cutting concern — authorization for every other module
- **Project Module**: manages projects and tasks within a tenant, including assignment rules
- **Agent Module**: LLM-driven automation over a whitelist of module actions. Work in progress: domain sketch only, not wired to routes, container or database

### Module Interface Contract

Each module defines its public surface in two places:
- `index.ts` — type definitions for inputs and outputs
- `<name>.module.ts` — the orchestrator class whose public methods *are* the module's operations

## 2. Inter-Module Communication

Two mechanisms coexist, chosen by the nature of the dependency.

### 2.1 Consumer-Defined Interfaces (synchronous)

When a module needs a value back — or needs authorization — the **consuming** module declares the interface it wants and a container key, in its own directory:

- `src/modules/project/UserModule.ts` → `ProjectUserModule` + `ProjectUserModuleKey`
- `src/modules/tenant/UserModule.ts` → `TenantUserModule` + `TenantUserModuleKey`

`UserModuleImpl` implements all of them (`implements ProjectUserModule, TenantUserModule`), and `main.ts` registers the same instance under every key. The consumer resolves it from the `Container` and only ever sees its own narrow interface.

This inverts the dependency: the provider conforms to the consumer's contract, not the other way round. Adding a consumer never changes the provider's interface — only its implementation list.

### 2.2 Mediator (asynchronous / fire-and-forget)

`src/modules/@common/Mediator.ts` provides `register(event, handler)` and `notify(event, input)`. It is used for:

- **Check-in**: the tenant module notifies `checkInUser`; the user module finds or creates the user and returns its id
- **Compensating actions**: `createTenantFail` and `addMemberFail` remove a user that was created for an operation that then failed

### 2.3 Choosing between them

| Need | Mechanism |
|---|---|
| A return value, synchronously | Consumer-defined interface |
| Permission / role check | Consumer-defined interface (`authorizer`) |
| Rollback or compensation hook | Mediator |
| Notification with no caller dependency on the result | Mediator |

## 3. Authorization Architecture

Authorization lives in the **application layer**, not in HTTP middleware. Routes only authenticate.

### The contract

```ts
interface AuthorizerApplicationService<I extends AuthorizedInput, O> {
    execute(input: I): Promise<O>;
}

type AuthorizedInput = { userId: string; tenantId: string };
```

Every tenant-scoped use case implements this interface, which forces its input to carry the caller and the tenant.

### The decorators

- `AuthorizerDecorator` — resolves the caller's role for the tenant via `UserQuery`, checks each required permission against the `Permissions` map, throws `Forbidden` before delegating to the wrapped use case
- `SuperAdminAuthorizerDecorator` — same shape for system-wide operations, checking only `isSuperAdmin`

Both are created through the user module's factory methods (`authorizer`, `superAdminAuthorizer`), so consumers never import them directly.

### Composition point

The orchestrator composes transaction + authorizer + use case:

```ts
return this._db.transaction(async (tx) => {
    const useCase = new UpdateTask(new TaskRepositoryDatabase(tx));
    const authorizer = this._userModule.authorizer(useCase, ['task:update']);
    return await authorizer.execute(input);
});
```

### Domain-level checks

Some rules go beyond "may the caller do this". `TaskService.assignUser` verifies that the **assignee's** role permits `task:update` and `task:read` before the assignment is allowed — a permission rule that belongs to the domain, not to the request.

## 4. Repository Pattern

Repositories are used for aggregate persistence and follow specific guidelines.

### Repository Responsibilities

Repositories handle:
- **Saving Aggregates**: persisting aggregate roots
- **Retrieving Aggregates**: loading aggregates by criteria
- **Aggregate Queries**: checking existence of aggregates (`has`)

### Repository Restrictions

Repositories must NOT:
- Retrieve partial aggregates (use the `query/` layer for projections)
- Expose database-specific details to application layers
- Handle business logic (that belongs in domain entities)

### Partial writes via change tracking

Repositories deliberately do **not** rewrite an entire aggregate on every save. The aggregate root records what happened, and the repository translates that into the minimal statements:

- `Project` / `Task`: a creation event (`projectCreated`, `taskCreated`) selects the INSERT branch; its absence means UPDATE of the mutable columns only
- `Tenant`: membership events are replayed as precise INSERT/UPDATE/DELETE against the `membership` table

The aggregate boundary is still respected — the writes never touch data outside the aggregate. What is optimized is *how much* of the aggregate is written, not *which* aggregate.

### Aggregate Boundary Enforcement

- **Tenant Aggregate**: `Tenant` includes its memberships
- **User Aggregate**: `User` is its own aggregate root
- **Project Aggregate**: `Project` is its own aggregate root — it does **not** contain its tasks
- **Task Aggregate**: `Task` is its own aggregate root, referencing its project and assignee by id

Project and Task are separate aggregates so tasks can be created and updated without loading the whole project. Consistency between them is enforced at the use-case level (`AddTask` loads the project and calls `ensureIsActive()`).

### Criteria / Specification

Queries into a repository are expressed as criteria objects rather than raw conditions. `BaseCriteria` holds `{ key, value, op }` triples, each module adds fluent builders (`ProjectCriteria.getById().getByTenantId()`), and `DrizzleCriteriaApply` translates them into a Drizzle `and(...)`. Tenant scoping is expressed as just another criterion.

## 5. Domain Entities and Aggregates

### Aggregate Roots

- **Tenant**: root of the tenant aggregate, containing membership information
- **User**: its own aggregate root
- **Project**: its own aggregate root
- **Task**: its own aggregate root
- **Agent** (WIP): root holding an ordered collection of steps

### Value Objects

- `Id` — wraps a UUID, generated on `create()`
- `ProjectStatus` — validates `active` | `closed`
- `TaskStatus` — validates `screen` | `working` | `review` | `done`
- `DueDate` — enforces start-before-end, may carry an open end
- `StepType` / `StepStatus` / `AgentType` (WIP)

Invalid states are unrepresentable: value objects validate in their factory and expose only a readonly `value`.

### Business Logic Placement

All business logic related to an aggregate resides within the aggregate root, or in a domain service when it spans more than one entity:
- Tenant validation (subdomain uniqueness, member limits) and membership management
- User activation and super admin status
- Project lifecycle (`ensureIsActive`)
- Task renaming, status transitions, due dates, assignment
- `TaskService` — assignment rules that involve both a task and a user's role

## Module Structure

Each module follows a consistent structure:

```
module-name/
├── index.ts                 # Public input/output types
├── module-name.module.ts    # Orchestrator: transactions + authorizers
├── module-name.routes.ts    # Express Router factory
├── UserModule.ts            # Consumer-defined contract for the user module
├── application/             # Use cases (write operations)
├── domain/                  # Domain entities, value objects, domain services
├── repository/              # Repository interfaces and implementations
├── query/                   # Query operations (read operations)
└── db/                      # Database schema definitions
```

### Application Layer

Use cases:
- Orchestrate domain operations
- Implement `AuthorizerApplicationService` so they can be wrapped by an authorizer
- Communicate with other modules via the mediator or a consumer-defined interface
- Return specific output types
- Never open transactions themselves

### Domain Layer

- Entities with business logic
- Value objects
- Domain events (via `Subject` / `Observer`)
- Domain services
- Aggregate roots

### Repository Layer

- Implements persistence for aggregates
- Maintains aggregate consistency
- Handles database-specific concerns

### Query Layer

- Handles read operations for display
- Free to join across modules' tables for projections (e.g. `ProjectQuery` joins `tasks` with `user` for the assignee)
- Separate from the domain and repository layers

## Communication Patterns

### Intra-Module Communication

Within a module, components communicate directly:
- The orchestrator opens a transaction and instantiates repositories with the `tx` handle
- Use cases call repositories and domain services
- Domain entities notify observers of changes
- Repositories translate tracked events into SQL

`ProjectModule` follows this consistently. `TenantModuleImpl` currently passes the shared `db` handle straight into its repositories instead of opening a transaction, so its multi-statement writes are not atomic — it relies on the mediator rollbacks alone.

### Inter-Module Communication

See section 2 — consumer-defined interfaces for synchronous needs, mediator for events and rollbacks.

## Data Flow Examples

### Tenant Creation Flow

1. Client calls `POST /api/tenants` with `x-user-id`
2. `authenticationMiddleware` loads the caller
3. The tenant module wraps the use case in a super-admin authorizer
4. The authorizer rejects non-super-admins before the use case runs
5. The use case notifies the mediator to check in the admin user
6. The user module returns the user id
7. The tenant aggregate is created with the admin membership and saved
8. On failure, `createTenantFail` removes the created user
9. Response returned to client

### Add Member Flow

1. Client calls `POST /api/tenants/:id/users` with `x-user-id` and `x-tenant-id`
2. The authorizer resolves the caller's role for the tenant and requires `tenant:user:add`
3. The mediator checks in the new user
4. The tenant aggregate is retrieved, validates the member limit, and adds the membership
5. The repository replays the membership events as targeted statements
6. On failure, the orchestrator's `catch` notifies `addMemberFail`, which removes the created user
7. Response returned to client

### Assign Task Flow

1. Client calls `PATCH /api/projects/:projectId/tasks/:taskId/assign`
2. The authorizer requires `task:assign` (admin only) for the caller
3. The task is loaded by criteria
4. The assignee's role is fetched through `ProjectUserModule.getUser`
5. `TaskService.assignUser` checks the assignee's role against `task:update` / `task:read`
6. The task is saved through the change-tracking UPDATE path
7. Response returned to client

## Error Handling and Rollback

- Database transactions ensure atomicity within a single module
- Cross-module operations use mediator-driven compensating actions (`createTenantFail`, `addMemberFail`) because a transaction cannot span modules
- Use cases and authorizers signal failure by throwing `Error`; route handlers do not catch, relying on Express 5's automatic promise rejection forwarding

> Known issue: `main.ts` registers its JSON error handler *before* the routers, so route errors currently fall through to Express's default handler and are returned as HTML 500 rather than JSON 400.

## Front-End Architecture Mirror

The SPA intentionally mirrors the back-end layering, in a functional style:

- **Model** (`model/`) — Zod schema + immutable `Readonly<{ props }>` values + pure transformation functions returning `Result<T, Error>`. This is the front-end's domain layer.
- **Application** (`application/`) — curried use cases: `(dependencies) => (input) => Promise<Result<...>>`
- **Gateway** (`gateway/`) — interface per domain plus an HTTP implementation; responses are parsed through the model's `From()` so invalid payloads are dropped rather than propagated
- **Store** (`model/common/Storage.ts`) — minimal observable store per model, read through `useSyncExternalStore` in `hook/`

Errors cross layers as `Result<T, Error>` instead of exceptions.

## Deployment Architecture

The application is containerized with Docker and includes:
- Node.js application container (also serves the built SPA)
- PostgreSQL database container
- Nginx reverse proxy container

Nginx handles subdomain routing, providing multi-tenancy at the infrastructure level. Application-side subdomain resolution is currently inactive — tenancy is resolved from the `x-tenant-id` header.
