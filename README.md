# rdr

A self-hosted RSS/Atom feed reader built with Nuxt 3 and SQLite.

## Features

- 📰 **RSS/Atom Feed Reader** – Subscribe to and read your favorite feeds
- 📁 **Category Organization** – Organize feeds into categories
- 📥 **OPML Import/Export** – Import and export your feed subscriptions
- 🖼️ **Image Caching** – Proxies and caches images for privacy and performance
- 🔐 **WebAuthn/Passkey Support** – Passwordless authentication with passkeys
- 🌙 **Dark Mode** – Dracula-inspired color scheme with dark mode support
- 🔗 **Linkding Integration** – Save articles to your Linkding bookmarks
- 🤖 **Kagi Summarization** – Summarize articles using Kagi AI
- 🔄 **Background Sync** – Automatic feed fetching with configurable schedules
- 📱 **Responsive Design** – Works on desktop and mobile devices

## Tech Stack

- **Frontend**: [Nuxt 3](https://nuxt.com/), [Vue 3](https://vuejs.org/), [Quasar](https://quasar.dev/)
- **Backend**: Nuxt server routes, Node.js
- **Database**: SQLite with [Knex.js](https://knexjs.org/)
- **Authentication**: nuxt-auth-utils, WebAuthn

## Quick Start

### Prerequisites

- Node.js 22+
- npm or pnpm

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Docker

### Using Docker

```bash
# Build the image
docker build -t rdr .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v rdr-data:/app/data \
  -e NUXT_SESSION_PASSWORD="your-32-character-secret-key-here" \
  rdr
```

### Docker Compose

```yaml
version: "3.8"
services:
  rdr:
    image: rdr
    ports:
      - "3000:3000"
    volumes:
      - rdr-data:/app/data
    environment:
      - NUXT_SESSION_PASSWORD=your-32-character-secret-key-here
    restart: unless-stopped

volumes:
  rdr-data:
```

## Configuration

Configuration is done via environment variables:

| Variable                   | Description                                     | Default                                  |
| -------------------------- | ----------------------------------------------- | ---------------------------------------- |
| `NUXT_SESSION_PASSWORD`    | Session encryption key (required, min 32 chars) | –                                        |
| `NUXT_DB_PATH`             | Path to SQLite database                         | `./data/db.sqlite3`                      |
| `NUXT_ENABLE_SIGN_UP`      | Enable user registration                        | `false`                                  |
| `NUXT_MULTI_USER`          | Enable multi-user mode                          | `false`                                  |
| `NUXT_ERROR_THRESHOLD`     | Error count before disabling feed               | `5`                                      |
| `NUXT_HTTP_TIMEOUT_MS`     | HTTP request timeout in milliseconds            | `30000`                                  |
| `NUXT_LOG_LEVEL`           | Log level (debug, info, warn, error)            | –                                        |
| `NUXT_IMAGE_DIGEST_SECRET` | Secret for image URL signing                    | –                                        |
| `NUXT_USER_AGENT`          | User-Agent string for feed fetching             | `Mozilla/5.0 (compatible; rdr/1.0; ...)` |

## Scripts

| Command                  | Description               |
| ------------------------ | ------------------------- |
| `npm run dev`            | Start development server  |
| `npm run build`          | Build for production      |
| `npm run start`          | Start production server   |
| `npm run lint`           | Run ESLint                |
| `npm run lint:fix`       | Fix ESLint issues         |
| `npm run prettier`       | Format code with Prettier |
| `npm run prettier:check` | Check code formatting     |
| `npm run test`           | Run tests with Vitest     |
| `npm run coverage`       | Run tests with coverage   |

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

## Integrations

### Linkding

rdr can save articles to your [Linkding](https://github.com/sissbruecker/linkding) instance. Configure in Settings:

1. Enter your Linkding API URL
2. Enter your Linkding API token
3. Optionally set default tags for saved bookmarks

### Kagi Summarization

Summarize articles using [Kagi's Universal Summarizer](https://kagi.com/summarizer). Configure in Settings:

1. Enter your Kagi session link
2. Select your preferred language

## Development

### Project Structure

```
├── app/
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
└── shared/             # Shared code between client/server
```

### Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run coverage
```

## License

MIT

## Author

[henry40408](https://github.com/henry40408)
