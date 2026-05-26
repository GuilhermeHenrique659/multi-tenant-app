# Detailed System Architecture Documentation

## Overview

This document provides a comprehensive overview of the system architecture, focusing on modularity, communication patterns, and data handling principles. The architecture follows Domain-Driven Design (DDD) principles with a clear separation of concerns between modules.

## 1. Modular Architecture

The system is built using a modular architecture where each module represents a distinct business capability:

### Module Principles

1. **Module Isolation**: Modules must not call other modules directly
2. **Interface Exposure**: Each module exposes its functionality through a well-defined interface
3. **Mediator Communication**: Modules communicate via the mediator pattern for loose coupling
4. **Single Responsibility**: Each module focuses on a specific business domain

### Current Modules

- **Tenant Module**: Manages tenant creation, membership, and tenant-specific operations
- **User Module**: Handles user authentication, creation, and user-specific operations

### Module Interface Contract

Each module defines its public interface in its `index.ts` file, which includes:
- Type definitions for inputs and outputs
- Interface definition for module operations
- Clear separation between read and write operations

## 2. Mediator Pattern

The mediator pattern is the primary mechanism for inter-module communication. The implementation in `src/modules/@common/Mediator.ts` provides:

- **Event Registration**: Modules can register handlers for specific events
- **Event Notification**: Modules can notify the mediator of events
- **Decoupled Communication**: Modules don't need to know about each other directly

### Usage Example

In the Tenant module's CreateTenant use case, when creating a new tenant with an admin user:

1. The tenant module notifies the mediator with a 'checkInUser' event
2. The mediator routes this to the user module's checkInUser handler
3. The user module processes the request and returns the result
4. The tenant module continues with tenant creation using the returned user information

This approach ensures:
- Loose coupling between modules
- Clear separation of concerns
- Easy testability of individual modules
- Flexibility to add new modules without affecting existing ones

## 3. Repository Pattern

Repositories are strictly used for aggregate persistence operations and follow specific guidelines:

### Repository Responsibilities

Repositories should ONLY handle:
- **Saving Aggregates**: Persisting complete aggregate roots
- **Retrieving Aggregates**: Loading complete aggregates by criteria
- **Aggregate Queries**: Counting or checking existence of aggregates
- **Removing Aggregates**: Deleting complete aggregates

### Repository Restrictions

Repositories must NOT:
- Update partial aggregates
- Retrieve partial aggregates
- Expose database-specific details to application layers
- Handle business logic (that belongs in domain entities)

### Aggregate Boundary Enforcement

Each repository strictly respects aggregate boundaries:

- **Tenant Aggregate**: The Tenant entity includes its memberships as part of the aggregate
- **User Aggregate**: The User entity is its own aggregate root
- **No Partial Loading**: When retrieving an aggregate, all related entities within the aggregate boundary are loaded

## 4. Domain Entities and Aggregates

Domain entities encapsulate business logic and maintain consistency within their aggregates:

### Aggregate Roots

- **Tenant**: The root of the tenant aggregate, containing membership information
- **User**: The root of the user aggregate

### Business Logic Placement

All business logic related to an aggregate resides within the aggregate root:
- Tenant validation (subdomain uniqueness, member limits)
- Membership management (adding, removing, role changes)
- User authentication and super admin status

## Module Structure

Each module follows a consistent structure:

```
module-name/
├── index.ts                 # Module interface and types
├── module-name.module.ts    # Module implementation
├── application/             # Application use cases (write operations)
├── domain/                  # Domain entities and business logic
├── repository/              # Repository interfaces and implementations
├── query/                   # Query operations (read operations)
└── db/                      # Database schema definitions
```

### Application Layer

The application layer contains use cases that:
- Orchestrate domain operations
- Handle transactions
- Communicate with other modules via the mediator
- Return specific output types

### Domain Layer

The domain layer contains:
- Entities with business logic
- Value objects
- Domain events
- Aggregate roots

### Repository Layer

The repository layer:
- Implements persistence operations for aggregates
- Maintains aggregate consistency
- Handles database-specific concerns

### Query Layer

The query layer:
- Handles read operations for data display
- Can optimize for specific query needs
- Is separate from the domain and repository layers

## Communication Patterns

### Intra-Module Communication

Within a module, components communicate directly:
- Application use cases call repositories
- Domain entities notify observers of changes
- Repositories handle database operations

### Inter-Module Communication

Between modules, communication follows these patterns:

1. **Mediator Pattern**: Primary communication mechanism
2. **Interface Contracts**: Modules expose functionality through interfaces
3. **Event-Driven**: Modules react to events rather than making direct calls

## Data Flow Examples

### Tenant Creation Flow

1. Client calls `/tenants` endpoint
2. Super admin middleware validates permissions
3. Tenant module creates a transaction
4. Tenant module notifies mediator to check-in admin user
5. User module processes check-in and returns user ID
6. Tenant module creates tenant entity with admin membership
7. Tenant repository saves the complete tenant aggregate
8. Response returned to client

### Add Member Flow

1. Client calls `/tenants/:id/users` endpoint
2. Permission middleware validates access
3. Tenant module creates a transaction
4. Tenant module notifies mediator to check-in new user
5. User module processes check-in and returns user ID
6. Tenant module retrieves tenant aggregate
7. Tenant entity adds membership (business logic validation)
8. Tenant repository saves changes to the aggregate
9. Response returned to client

## Error Handling and Rollback

The system implements rollback mechanisms for multi-step operations:

- When tenant creation fails after user creation, the mediator is notified to remove the user
- When adding a member fails after user creation, the mediator is notified to remove the user
- Database transactions ensure atomicity of operations within a single module

## Deployment Architecture

The application is containerized with Docker and includes:
- Node.js application container
- PostgreSQL database container
- Nginx reverse proxy container

Nginx handles subdomain routing to provide multi-tenancy at the infrastructure level.