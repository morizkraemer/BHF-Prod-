# Produktionstool

Monorepo: Electron desktop app + API backend for gathering end-of-shift information at a nightclub.

## Repository structure

- **`apps/electron/`** – Electron app (React UI, forms, scanner, shift flow)
- **`apps/backend/`** – Node/Express API (Postgres, catalogs, events, documents, Secu form)
- **Root** – `docker-compose.yml`, docs, shared scripts

## Development

### From repo root (pnpm workspace)

1. Install all dependencies:
   ```bash
   pnpm install
   ```

2. Run the Electron app:
   ```bash
   pnpm start:electron
   # or with DevTools
   pnpm dev:electron
   ```

3. Run the backend (local, no Docker):
   ```bash
   pnpm start:backend
   # or with nodemon
   pnpm dev:backend
   ```

4. Run backend via Docker (Postgres + API):
   ```bash
   pnpm docker:up
   ```
   API: `http://localhost:3001`. Stop with `pnpm docker:down`.

### From an app directory

- **Electron:** `cd apps/electron && pnpm install && pnpm start` (or `pnpm dev`)
- **Backend:** `cd apps/backend && pnpm install && pnpm start` (or `pnpm dev`). Set `DATABASE_URL` and `STORAGE_PATH` (see `apps/backend/.env.example`).

## Building the Electron app

```bash
cd apps/electron
pnpm run build        # macOS
pnpm run build:mac
pnpm run build:win
pnpm run build:linux
pnpm run build:all
```

Output goes to `apps/electron/dist/`.

## Project structure (Electron app)

- `main.js` – Electron main process
- `preload.js` – Preload script for secure IPC
- `index.html` – Main window HTML
- `src/` – React components and styles
- `handlers/` – IPC handlers (catalogs, settings, shift data, scanner, reports)
- `api/` – API client for backend
- `assets/` – Icons and other assets

See `REFACTOR-PLAN.md` for architecture and `PLAN.md` for the project plan.
