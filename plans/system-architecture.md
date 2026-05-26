# Tenant Management System Architecture

## Overview

This is a multi-tenant application built with Node.js, Express, and PostgreSQL. The system allows for the creation and management of tenants, each with their own users and permissions. The application uses a subdomain-based approach to identify tenants.

## Key Components

### 1. Main Application (src/main.ts)

The entry point of the application sets up:
- Express server with JSON middleware
- Database connection via Drizzle ORM
- Mediator pattern for handling events
- User and Tenant modules
- Route definitions for tenant and user management
- Middleware for permission checking

### 2. Modules

#### Tenant Module
- **Domain**: Tenant and Membership entities with business logic
- **Application**: Use cases for creating tenants, adding/removing members, updating member roles
- **Database**: Tenant and Membership tables with repository implementations
- **Query**: Data retrieval operations for tenant information

#### User Module
- **Domain**: User entity with properties like name, email, active status, and super admin flag
- **Application**: Use cases for user login, check-in, removal, and super admin creation
- **Database**: User table with repository implementations
- **Query**: Data retrieval operations for user information

### 3. Common Components

#### Mediator
Implements the mediator pattern for handling events and communication between components.

#### Middleware
- `tenantSubdomainMiddleware`: Extracts tenant information from subdomain
- `superAdminPermissionMiddleware`: Checks if user is a super admin
- `permissionMiddleware`: Checks user permissions for specific actions

#### Permissions
A mapping of permissions to roles that are allowed to perform those actions.

## Data Flow

### Tenant Creation
1. Super admin makes POST request to `/tenants`
2. Middleware validates super admin permissions
3. Tenant module creates tenant in database
4. If failure occurs, rollback mechanism removes associated user

### User Addition to Tenant
1. Authenticated user with appropriate permissions makes POST request to `/tenants/:id/users`
2. Middleware validates user permissions
3. Tenant module adds user to tenant
4. If failure occurs, rollback mechanism removes created user

### User Authentication
1. User makes POST request to `/users` with email
2. User module checks if user exists and creates if not
3. Returns user information

### Tenant Access
1. Request comes in with subdomain in host header
2. Middleware extracts tenant information based on subdomain
3. Application can then provide tenant-specific functionality

## Database Schema

### User Table
- id (primary key)
- name
- email (unique)
- isActive
- isSuperAdmin
- createdAt

### Tenant Table
- id (primary key)
- name
- subdomain (unique)
- maxNumberOfMembers
- createdAt

### Membership Table
- tenantId (foreign key to Tenant)
- userId (foreign key to User)
- role
- Composite primary key on (tenantId, userId)

## Deployment

The application is containerized with Docker and includes:
- Node.js application container
- PostgreSQL database container
- Nginx reverse proxy container

Nginx is configured to handle subdomain routing to the appropriate tenant.

## Key Features

1. **Multi-tenancy**: Each tenant is isolated with its own subdomain
2. **Role-based Access Control**: Admin and member roles with specific permissions
3. **Rollback Mechanisms**: Transaction-based operations with rollback on failure
4. **Super Admin Functionality**: Special permissions for system-wide management
5. **Subdomain Routing**: Tenants are accessed via subdomains