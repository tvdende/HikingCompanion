## MODIFIED Requirements

### Requirement: Relational Schema Definition
The database system SHALL define normalized SQL tables for `users` (including `id`, `email`, `name`, `avatarUrl`, `role`, `isActive`, `createdAt`, `lastLoginAt`), `sessions` (including `id`, `userId`, `token`, `expiresAt`), `oauth_accounts` (including `id`, `userId`, `provider`, `providerAccountId`), and `routes` (including `id`, `userId`, `title`, `totalDistanceKm`, `coordinates`, `stages`, `elevationMetrics`, `createdAt`, `updatedAt`) with strict primary keys, foreign key constraints, and timestamps.

#### Scenario: Database schema integrity
- **WHEN** user records, OAuth identities, and active sessions are stored
- **THEN** foreign key constraints enforce relational integrity and cascading cleanup on user deletion

#### Scenario: User routes deletion cascade
- **WHEN** a user account with saved routes is deleted
- **THEN** foreign key cascade constraints automatically delete all associated route records from the database
