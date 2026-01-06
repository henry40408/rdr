# Contributing to rdr

Thank you for your interest in contributing to rdr! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 22+
- npm or pnpm

### Development Setup

```bash
# Clone the repository
git clone https://github.com/henry40408/rdr.git
cd rdr

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

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

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run coverage
```

## Code Style

- Run `npm run lint` before committing to check for linting issues
- Run `npm run prettier` to format code
- Follow existing code patterns and conventions

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub with:

- A clear description of the issue or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
