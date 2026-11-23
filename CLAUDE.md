# CIC Chat — project guide

Enterprise web chat for employees: authentication, real-time 1:1 and group messaging,
conversation + message history, online/offline presence, responsive UI.

This is a timed interview prototype. Code quality is judged: clean code, SOLID, small
single-purpose functions and files, clear names, no dead code, no over-engineering.
**Build only what is asked.**

## Stack (JavaScript only, no TypeScript)

- npm workspaces monorepo: `apps/server`, `apps/web`. Node 20 (`.nvmrc`).
- **apps/server**: ES modules, Express 5, Socket.IO, Prisma + PostgreSQL, zod, bcryptjs,
  jsonwebtoken, cookie-parser, helmet, cors, express-rate-limit, pino, vitest.
- **apps/web**: Next.js 15 (App Router, JavaScript, `src/`), Tailwind CSS 4,
  @tanstack/react-query, socket.io-client.
- `docker-compose.yml`: postgres:16-alpine only.

## Commands (repo root)

| Command | What it does |
|---|---|
| `docker compose up -d` | Start Postgres |
| `npm run dev` | Server (:4000) + web (:3000) concurrently |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `prisma db seed` (`apps/server/prisma/seed.js`) |
| `npm test` | vitest (server) |
| `npm run lint` | ESLint, all workspaces |

Env: copy `apps/server/.env.example` → `apps/server/.env` and `apps/web/.env.example` →
`apps/web/.env.local`. Never commit secrets.

## Server architecture

Each layer only talks to the one directly below it:

```
routes → middleware → controller → service → repository → Prisma/PostgreSQL
socket event → socket middleware → socket handler → service (same services as REST)
```

```
apps/server/src/
  app.js                 builds the Express app (no listen)
  server.js              HTTP server, attaches Socket.IO, listens, graceful shutdown
  config/env.js          validates process.env with zod, fails fast
  lib/                   prisma.js, logger.js, AppError.js, jwt.js
  middleware/            authenticate.js, validate.js, errorHandler.js, rateLimiters.js
  modules/<feature>/     <feature>.routes.js, .controller.js, .service.js, .repository.js, .schemas.js
                         features: auth, users, conversations, messages
  realtime/              socketServer.js, socketAuth.js, events.js (event name constants),
                         presenceStore.js, handlers/messageHandlers.js, handlers/connectionHandlers.js
```

## Rules

- Controllers are thin: read the request, call **one** service method, send the response.
- Business rules and permission checks live in **services**.
- Prisma is used **only** in repositories.
- Validate every REST input and every socket payload with zod.
- Errors: `throw new AppError(statusCode, code, message)`; `errorHandler` maps it to
  `{ error: { code, message } }`. Never leak stack traces.
- Named exports, async/await, early returns. JSDoc only where intent isn't obvious.
- No secrets committed; keep `.env.example` files current.
