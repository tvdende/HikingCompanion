# database-storage Specification

## Purpose
Provides persistent relational database storage powered by Cloudflare D1 (SQLite) and Drizzle ORM for users, accounts, sessions, and core application data.

## Requirements

### Requirement: Relational Schema Definition
The database system SHALL define normalized SQL tables for `users` (including `id`, `email`, `name`, `avatarUrl`, `role`, `isActive`, `createdAt`, `lastLoginAt`), `sessions` (including `id`, `userId`, `token`, `expiresAt`), and `oauth_accounts` (including `id`, `userId`, `provider`, `providerAccountId`) with strict primary keys, foreign key constraints, and timestamps.

#### Scenario: Database schema integrity
- **WHEN** user records, OAuth identities, and active sessions are stored
- **THEN** foreign key constraints enforce relational integrity and cascading cleanup on user deletion

### Requirement: Database Migrations Management
The database system SHALL manage schema migrations using Drizzle Kit, allowing automated schema upgrades in local, test, and production environments.

#### Scenario: Running schema migrations
- **WHEN** new migrations are executed against Cloudflare D1
- **THEN** the schema updates transactionally without data corruption or loss of existing records
