# Architecture

This document describes the project structure and architecture of rdr.

## Tech Stack

- **Frontend**: [Nuxt 3](https://nuxt.com/), [Vue 3](https://vuejs.org/), [Quasar](https://quasar.dev/)
- **Backend**: Nuxt server routes, Node.js
- **Database**: SQLite with [Knex.js](https://knexjs.org/)
- **Authentication**: nuxt-auth-utils, WebAuthn

## Project Structure

```
├── app/
│   ├── assets/         # CSS and static assets
│   ├── components/     # Vue components
│   ├── pages/          # Nuxt pages
│   ├── stores/         # Pinia stores
│   └── utils/          # Client-side utilities
├── server/
│   ├── api/            # API routes
│   ├── middleware/     # Server middleware
│   ├── migrations/     # Database migrations
│   ├── plugins/        # Server plugins
│   └── utils/          # Server-side services
├── public/             # Static assets
├── shared/             # Shared code between client/server
└── test/               # Test files
```

## Frontend

### Components (`app/components/`)

Vue components organized by feature:

- `authenticated/` – Components for authenticated views (Home, Feeds, Settings)
- `feeds/` – Feed-related components (FeedItem, FeedList, CategoryList, etc.)
- `home/` – Home page components
- `settings/` – Settings page components

### Pages (`app/pages/`)

Nuxt pages that define the application routes:

- `index.vue` – Home page
- `feeds.vue` – Feeds management page
- `settings.vue` – Settings page

### Stores (`app/stores/`)

Pinia stores for state management:

- `useCategoryStore.js` – Category state
- `useEntryStore.js` – Entry/article state
- `useFeedStore.js` – Feed state
- `useJobStore.js` – Background job state
- `usePasskeyStore.js` – Passkey/WebAuthn state
- `useSystemSettingsStore.js` – System settings state
- `useUserSettingsStore.js` – User settings state
- `useUserStore.js` – User authentication state

## Backend

### API Routes (`server/api/`)

RESTful API endpoints organized by resource:

- `categories/` – Category CRUD operations
- `entries/` – Entry listing and management
- `feeds/` – Feed CRUD operations
- `images/` – Image proxying and caching
- `jobs/` – Background job management
- `opml/` – OPML import/export
- `passkeys/` – Passkey/WebAuthn management
- `system-settings/` – System configuration
- `user-settings/` – User preferences
- `users/` – User management
- `webauthn/` – WebAuthn authentication flow

### Services (`server/utils/`)

Business logic services:

- `download-service.js` – HTTP download utilities
- `feed-service.js` – Feed parsing and fetching
- `image-service.js` – Image proxying and caching
- `job-service.js` – Background job scheduling
- `linkding-service.js` – Linkding integration
- `opml-service.js` – OPML parsing and generation
- `repository.js` – Database access layer

### Migrations (`server/migrations/`)

Database schema migrations using Knex.js. Migrations are applied automatically on startup.

### Plugins (`server/plugins/`)

Nuxt server plugins for initialization:

- `10.container.js` – Dependency injection container setup

## Database

SQLite database with the following main tables:

- `users` – User accounts
- `feeds` – RSS/Atom feed subscriptions
- `entries` – Feed entries/articles
- `categories` – Feed categories
- `passkeys` – WebAuthn credentials
- `user_settings` – User preferences
- `system_settings` – System configuration

## API Endpoints

### Authentication

- `POST /api/signup` – Create a new account (when enabled)
- `POST /api/login` – Log in with username and password
- `POST /api/change-password` – Change password

### Feeds & Entries

- `GET /api/entries` – List entries
- `GET /api/feeds` – List feeds
- `POST /api/feeds` – Add a new feed
- `GET /api/categories` – List categories
- `POST /api/categories` – Create a category

### OPML

- `GET /api/opml` – Export feeds as OPML
- `POST /api/opml` – Import feeds from OPML

### Passkeys

- `GET /api/passkeys` – List passkeys
- `POST /api/passkeys` – Register a new passkey

### Other

- `GET /api/features` – Get enabled features
- `GET /api/healthz` – Health check endpoint
- `GET /api/images/:digest` – Proxied images
