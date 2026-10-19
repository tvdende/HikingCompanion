## ADDED Requirements

### Requirement: Authentication Status Trigger
The application header SHALL render an authentication trigger displaying an "Inloggen" button for guests, and a user profile avatar with dropdown menu (showing name, role badge, Admin Management link for admins, and logout action) for authenticated users.

#### Scenario: Unauthenticated visitor
- **WHEN** an unauthenticated visitor opens the application
- **THEN** the header displays the "Inloggen" button which opens the OAuth provider selection modal upon click

#### Scenario: Authenticated regular user
- **WHEN** an authenticated user with role `user` or `planner` opens the application
- **THEN** the header displays the user's avatar, name, and role badge with a logout action in the profile menu

#### Scenario: Authenticated administrator
- **WHEN** an authenticated user with role `admin` opens the application
- **THEN** the header profile menu includes a prominent "Gebruikersbeheer" action that opens the administrative user panel

### Requirement: Administrative User Management Interface
The PWA SHALL provide an administrative user management view accessible exclusively to users with the `admin` role, allowing them to search registered users, change roles, deactivate/activate accounts, and delete users.

#### Scenario: Admin opens and uses user management
- **WHEN** an administrator clicks "Gebruikersbeheer"
- **THEN** a management panel opens showing all registered users with controls to filter, change roles (`user`, `planner`, `admin`), toggle active status, and remove users
