# CIC Chat — project guide

Enterprise web chat for employees: authentication, real-time 1:1 and group messaging,
conversation + message history, online/offline presence, responsive UI.

This is a timed interview prototype. Code quality is judged: clean code, small single-purpose
functions and files, clear names, no dead code, no over-engineering. **Build only what is asked.**
Prefer a well-established library over hand-written code; every line should be explainable in a sentence.

## Stack (JavaScript only, no TypeScript)

- npm workspaces monorepo: `apps/server`, `apps/web`. Node 20 (`.nvmrc`).
- **apps/server**: ES modules, Express 5, Socket.IO, Prisma + PostgreSQL, zod, bcryptjs, jsonwebtoken,
  cookie-parser + cookie, helmet, cors, express-rate-limit, rate-limiter-flexible, pino + pino-http, vitest.
- **apps/web**: Next.js 15 (App Router, JavaScript, `src/`), Mantine 8 (core, hooks, form, notifications),
  @tanstack/react-query, socket.io-client, ky, dayjs, react-virtuoso. **No Tailwind / custom CSS.**
- `docker-compose.yml`: postgres:16-alpine, server and web (built from `apps/*/Dockerfile`).

## Commands (repo root)

| Command | What it does |
|---|---|
| `docker compose up -d --build` | Whole stack: Postgres (host **5433**), server (:4000), web (:3000) |
| `docker compose exec server npx prisma db seed` | Seed the Docker stack |
| `docker compose up -d postgres` | Postgres only, for local development |
| `npm run dev` | Server (:4000) + web (:3000) with hot reload |
| `npm run db:migrate` | `prisma migrate dev` (new named migration: `cd apps/server && npx prisma migrate dev --name <name>`) |
| `npm run db:seed` | Re-runnable. Users alice/bob/carol/dave@cic.test, password `Password123!` |
| `npm test` | vitest (server) |
| `npm run lint` | ESLint, all workspaces |

Env for local dev: copy `apps/server/.env.example` → `apps/server/.env` and `apps/web/.env.example` →
`apps/web/.env.local`. Never commit secrets.

## Server architecture

```
routes → middleware → controller → service → Prisma/PostgreSQL
socket event → socket middleware → socket handler → service (same services as REST)
```

There is no repository layer: Prisma is the data-access layer. Services call `prisma` directly; a query
gets its own helper only when it is genuinely complex (`conversations.queries.js`, raw SQL).

```
apps/server/src/
  app.js                 the Express app (no listen)
  server.js              HTTP server + Socket.IO, listen, graceful shutdown
  routes.js              mounts feature routers under /api
  config/env.js          validates process.env with zod, fails fast
  lib/                   prisma (+ passwordHash omitted globally), logger, AppError, jwt, sessionCookie,
                         validation (parseOrThrow), presenceStore, domainEvents (EventEmitter)
  middleware/            authenticate, validate, rateLimiters, requestLogger, errorHandler
  modules/<feature>/     <feature>.routes.js, .controller.js, .service.js, .schemas.js (+ tests)
                         features: auth, users, conversations (+ conversations.queries.js), messages
  realtime/              socketServer.js (setup + domain event subscriptions), socketAuth.js, events.js, rooms.js,
                         handlers/messageHandlers.js, handlers/connectionHandlers.js, handlers/withAck.js
```

- Modules export plain named functions; routers are module-level `Router()`s. No factories.
- Services never import Socket.IO. They emit on `domainEvents` (e.g. `CONVERSATION_CREATED`) and
  `realtime/socketServer.js` subscribes (joins rooms, emits `conversation:new`).
- Socket handlers wrap work in `withAck`: validate with `parseOrThrow`, always ack, never throw.
- Tests mock the Prisma module (`vi.mock('../../lib/prisma.js')`).

## Data model conventions

- UUID ids; snake_case tables/columns via `@@map`/`@map`; String fields instead of Prisma enums
  (`Conversation.type`: `direct|group`; `ConversationMember.role`: `owner|member`).
- Emails stored lowercase. `directKey` = the two user ids sorted and joined with `:`.

## Web app (apps/web/src)

- `lib/` apiClient (ky instance), socketClient (singleton), events (must match server), queryKeys,
  chatCache (pure cache updaters: messages, conversation previews, presence), formatTime (dayjs).
- `providers/` AppProviders (Mantine, Notifications, React Query, Auth) in the root layout;
  SocketProvider (connection + status) in the chat layout, behind the auth guard.
- `hooks/` data hooks (conversations, messages, send, directory) + `useRealtimeCacheSync`.
- `components/chat`, `components/auth`: Mantine components only. Layout uses `AppShell`.
- Presence is two fields (`isOnline`, `lastSeenAt`) on conversation members in the React Query cache:
  seeded by `GET /conversations`, patched by `presence:update`, refreshed on reconnect.
- Theme: Mantine `primaryColor: 'indigo'`, neutral greys otherwise.

## API contract

The full contract lives in `docs/ARCHITECTURE.md` ("REST API" and "Socket events"); update it with any API change.
Key points: REST under `/api`; messages page `{ items (newest first), nextCursor (message id) }`; event names in
`CLIENT_EVENTS` / `SERVER_EVENTS` must be identical in `apps/server/src/realtime/events.js` and `apps/web/src/lib/events.js`.

## Docs (keep in sync with code)

- `docs/ARCHITECTURE.md`: diagrams, ERD, REST API and socket event tables.
- `docs/DECISIONS.md`: design decisions (Context / Decision / Trade-off).
- `docs/PRODUCTION_READINESS.md`: implemented, known gaps, roadmap.

## Rules

- Controllers are thin: read the request, call **one** service function, send the response.
- Business rules and permission checks (`assertMember`) live in **services**.
- Validate every REST input and every socket payload with zod.
- Errors: `throw new AppError(statusCode, code, message)`; `errorHandler` maps it to
  `{ error: { code, message } }`. Never leak stack traces.
- Named exports, async/await, early returns. JSDoc only where intent isn't obvious.
- No secrets committed; keep `.env.example` files current.
