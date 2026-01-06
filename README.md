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

## Quick Start

### Using Docker (Recommended)

```bash
docker run -d \
  -p 3000:3000 \
  -v rdr-data:/app/data \
  -e NUXT_SESSION_PASSWORD="your-32-character-secret-key-here" \
  ghcr.io/henry40408/rdr
```

The application will be available at `http://localhost:3000`.

### Docker Compose

```yaml
version: "3.8"
services:
  rdr:
    image: ghcr.io/henry40408/rdr
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

### Building from Source

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
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

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) – How to contribute to this project
- [ARCHITECTURE.md](ARCHITECTURE.md) – Project structure and technical details

## License

MIT

## Author

[henry40408](https://github.com/henry40408)
