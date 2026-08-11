# Tenant Management System Architecture

## Overview

This is a multi-tenant application built with Node.js, Express 5, and PostgreSQL, with a React 19 SPA front end. The system allows for the creation and management of tenants, each with their own users, permissions, projects and tasks.

Tenancy is currently resolved per request from the `x-tenant-id` header. The infrastructure for subdomain-based resolution still exists (nginx wildcard vhosts, the `tenant.subdomain` column, `tenantSubdomainMiddleware`), but no route uses it today.

## Key Components

### 1. Main Application (src/main.ts)

The entry point of the application sets up:
- Express server with JSON middleware
- Database connection via Drizzle ORM
- A `Container` holding the mediator and the user-module implementation
- Mediator event handlers (`checkInUser`, `createTenantFail`, `addMemberFail`)
- Super admin seeding from `SUPER_ADMIN_NAME` / `SUPER_ADMIN_EMAIL`
- Winston-based request logging
- Router mounting: every entry of `src/modules/router.ts` under `/api<path>`
- Static serving of `frontend/dist` with an SPA fallback

> Known issue: the error-handling middleware is registered before the routers, so it does not catch errors thrown by route handlers.

### 2. Modules

#### Tenant Module
- **Domain**: `Tenant` (aggregate root) and `Membership` entities with business logic
- **Application**: create tenant, add member, remove member, update member role, get by id, list
- **Database**: `tenant` and `membership` tables with repository implementations
- **Query**: `TenantQuery` for tenant/member projections

#### User Module
- **Domain**: `User` entity — name, email, active status, super admin flag
- **Application**: login, check-in, removal, super admin creation, plus the authorization decorators
- **Database**: `user` table with repository implementation
- **Query**: `UserQuery` — lookup by id/name and role resolution per tenant
- **Cross-cutting role**: implements every consumer-defined `UserModule` interface, so it is the single source of authorization for the whole system

#### Project Module
- **Domain**: `Project` and `Task` aggregate roots, `ProjectStatus`, `TaskStatus` and `DueDate` value objects, plus `TaskService` for assignment rules
- **Application**: create project, list projects, add task, list tasks, get task, update task, assign task
- **Database**: `projects` and `tasks` tables with repository implementations
- **Query**: `ProjectQuery` — project/task listings and task-with-assignee join

#### Agent Module (work in progress)
- Intended to run LLM-driven automations against a whitelist of module actions (`AllowModules.ts`)
- `Agent` (aggregate) holds an ordered `StepCollection`; each `Step` is an `ACTION` or an `ASK` with a lifecycle status
- `LLMGateway` and `AgentRepository` are interfaces only; `CreateAgent.execute()` is empty
- Not registered in the router, the container, or the database schema

### 3. Common Components (`src/modules/@common/`)

#### Container
Minimal service locator (`Map<string, any>`) used to hand module dependencies to route factories.

#### Mediator
Typed pub/sub used for cross-module events and compensating actions (rollbacks).

#### Authorizer services
`AuthorizerApplicationService` and `SuperAdminAuthorizerApplicationService` define the contract that use cases implement so they can be wrapped by the user module's authorization decorators. This is the system's permission enforcement point.

#### Middleware
- `authenticationMiddleware`: validates the `x-user-id` header and loads the user — the only middleware currently in use
- `tenantSubdomainMiddleware`, `superAdminPermissionMidleware`, `permssionMiddleware`: legacy, no longer wired to any route

#### Permissions
A map of permission string → allowed roles (`admin`, `member`), covering tenant, project and task operations.

#### Observer / ChangeTrackingObserver
Lets aggregate roots record domain events so repositories can decide between INSERT and UPDATE, and replay membership changes precisely.

#### Logger
Winston logger with a console transport and timestamped output.

## Data Flow

### Tenant Creation
1. Super admin makes a `POST` request to `/api/tenants` with `x-user-id`
2. The tenant module wraps the use case in a super-admin authorizer, which rejects non-super-admins
3. The use case notifies the mediator (`checkInUser`) to find or create the admin user
4. The tenant aggregate is created with the admin membership and saved
5. On failure, `createTenantFail` is notified so the user creation is rolled back

### User Addition to Tenant
1. Authenticated user makes a `POST` request to `/api/tenants/:id/users` with `x-user-id` and `x-tenant-id`
2. The authorizer decorator resolves the caller's role for that tenant and requires `tenant:user:add`
3. The mediator checks in the new user
4. The tenant aggregate validates the member limit and adds the membership
5. The repository persists only the changes tracked on the aggregate
6. On failure, `addMemberFail` rolls back the user creation

### User Authentication
1. User makes a `POST` request to `/api/users` with an email
2. The user module reactivates the user if needed and returns `{ userId, name, isSuperAdmin }`
3. The SPA stores that in `localStorage`; subsequent requests carry `x-user-id`
4. JWT is planned but not implemented (`jsonwebtoken` is installed and unused)

### Project and Task Management
1. Client calls `/api/projects` or `/api/projects/:projectId/tasks*` with `x-user-id` and `x-tenant-id`
2. Each operation is wrapped in an authorizer requiring the matching permission (`project:create`, `task:update`, …)
3. Write operations run inside a transaction with per-transaction repositories; read operations go through `ProjectQuery` without a transaction
4. Assignment additionally passes through `TaskService`, which verifies the assignee's role allows `task:update` and `task:read`

## Database Schema

### User Table (`user`)
- id (primary key), name, email (unique), isActive, isSuperAdmin, createdAt

### Tenant Table (`tenant`)
- id (primary key), name, subdomain (unique), maxNumberOfMembers, createdAt

### Membership Table (`membership`)
- tenantId (foreign key to Tenant), userId (foreign key to User), role
- Composite primary key on (tenantId, userId)

### Project Table (`projects`)
- id (primary key), name, status (`active` | `closed`), tenantId (foreign key to Tenant), createdAt

### Task Table (`tasks`)
- id (primary key), name, status (`screen` | `working` | `review` | `done`), startAt, endAt, projectId (foreign key to Project), assigneeId (foreign key to User, nullable), createdAt

Migrations are versioned in `src/db/migrations/` (through `0005`), while `npm run start` uses `drizzle-kit push`.

## Deployment

The application is containerized with Docker and includes:
- Node.js application container (also serves the built SPA)
- PostgreSQL database container
- Nginx reverse proxy container

Nginx is configured to handle subdomain routing to the appropriate tenant, ready for when subdomain resolution is re-enabled in the application.

## Key Features

1. **Multi-tenancy**: tenant-scoped data with per-tenant roles; each tenant also owns a subdomain
2. **Role-based Access Control**: admin and member roles, enforced in the application layer by authorizer decorators
3. **Rollback Mechanisms**: transaction-based operations plus mediator-driven compensating actions
4. **Super Admin Functionality**: special permissions for system-wide management, seeded at boot
5. **Project & Task Management**: projects per tenant, tasks with status, due dates and permission-checked assignment
