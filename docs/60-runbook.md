# 60 — Runbook: Pong Arcade 3D

## Local Development

### 1. Prerequisites

- Node.js >= 20
- npm >= 10

### 2. Installation & Port Setup

```bash
# Install dependencies
npm install

# Start local development server (port 5320)
npm run dev
```

The game starts on `http://pong.localhost:5320`. The port is pinned strictly in `vite.config.ts` per `D:/Development/Tools/dev-ports.json`.

---

## Verification Pipeline

Always run the full verification gate before committing:

```bash
# Runs typecheck + unit/property tests + production build
npm run check
```

Sub-commands:
```bash
# Typecheck only
npm run typecheck

# 140 automated tests with Vitest
npm test

# Test coverage report
npm run test:coverage
```

---

## Production Build & Deployment

The production build compiles into the repository root because GitHub Pages serves the `main` branch from `/`:

```bash
npm run build
```

Artifacts produced:
- `index.html` (root)
- `assets/index-*.js`, `assets/three-*.js`, `assets/index-*.css`
- `CNAME` binds to `pong.naindev.com`

Deployment verification:
```bash
# Test preview server on port 5321
npm run preview
```
