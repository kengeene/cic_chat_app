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
| `docker compose up -d` | Start Postgres (host port **5433**; a local Postgres occupies 5432) |
| `npm run dev` | Server (:4000) + web (:3000) concurrently |
| `npm run db:migrate` | `prisma migrate dev` (new named migration: `cd apps/server && npx prisma migrate dev --name <name>`) |
| `npm run db:seed` | Re-runnable. Users alice/bob/carol/dave@cic.test, password `Password123!` |
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

## Data model conventions

- UUID ids; snake_case tables/columns via `@@map`/`@map`; String fields instead of Prisma enums
  (`Conversation.type`: `direct|group`; `ConversationMember.role`: `owner|member`).
- Emails stored lowercase. `directKey` = the two user ids sorted and joined with `:`.

## Docs (keep in sync with code)

- `docs/ARCHITECTURE.md`: diagrams, ERD, REST API and socket event tables.
- `docs/DECISIONS.md`: design decisions (Context / Decision / Trade-off).

## Web app (apps/web/src)

- `lib/` apiClient (fetch + `ApiError`), socketClient (singleton), events (must match server), queryKeys, chatCache (pure cache updaters), formatTime.
- `providers/` Query → Auth (root layout); Socket → Presence (chat layout, behind the auth guard).
- `hooks/` data hooks (conversations, messages, send, user search) + UI hooks (chat scroll, socket status).
- `components/ui` (Button, Input, Dialog only — no UI library), `components/chat`, `components/auth`.
- One accent colour: `accent` / `accent-hover` / `accent-soft` tokens in `globals.css`.

## API contract (the web client depends on it)

The full contract lives in `docs/ARCHITECTURE.md` ("REST API" and "Socket events"); update it with any API change.
Key points: REST under `/api`; messages page `{ items (newest first), nextCursor }`; event names in
`CLIENT_EVENTS` / `SERVER_EVENTS` must be identical in `apps/server/src/realtime/events.js` and `apps/web/src/lib/events.js`.

## Server wiring

- `services.js` builds every service with injected repositories, `presence`, and the `notifyConversationCreated`
  hook from `realtime/conversationNotifier.js`. Services never import Prisma or Socket.IO.
- `server.js`: create Socket.IO (unattached) → services → Express app → HTTP server → `attachSocketServer`.
  Socket.IO must attach *after* the app so it intercepts `/socket.io/` before Express's 404 handler.
- Socket handlers wrap work in `withAck` (validate with `parseOrThrow`, never throw).

## Rules

- Controllers are thin: read the request, call **one** service method, send the response.
- Business rules and permission checks live in **services**.
- Prisma is used **only** in repositories.
- Validate every REST input and every socket payload with zod.
- Errors: `throw new AppError(statusCode, code, message)`; `errorHandler` maps it to
  `{ error: { code, message } }`. Never leak stack traces.
- Named exports, async/await, early returns. JSDoc only where intent isn't obvious.
- No secrets committed; keep `.env.example` files current.
