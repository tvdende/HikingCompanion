## ADDED Requirements

### Requirement: Route Management and Lifecycle Schema
The database system SHALL store route records with extended attributes including lifecycle status (`status: 'draft' | 'definitive'`), text description (`description`), geographic region/location (`location`), and marketplace price in EUR (`price_eur`), with database defaults maintaining compatibility with existing saved routes.

#### Scenario: Storing route with lifecycle status and metadata
- **WHEN** a route is inserted or updated in Cloudflare D1
- **THEN** the `status`, `description`, `location`, and `price_eur` columns accurately persist the specified values with sensible defaults (`status = 'draft'`, `price_eur = 0.00`)
