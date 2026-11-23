# CIC Chat

An enterprise web chat for employees. People sign in with a work account and message colleagues in real time, one-to-one or in groups. Conversation history pages in on demand, and presence shows who is online. A Node.js server exposes a REST API and a Socket.IO gateway that share one service layer over PostgreSQL. The Next.js client updates optimistically (messages show as *sending* → *sent*, with retry) and works on desktop and mobile.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Monorepo | npm workspaces | One install and one set of scripts for both apps, with no extra tooling |
| Server | Node 20, Express 5 | Small and well known; Express 5 passes async errors to the error handler |
| Realtime | Socket.IO | Rooms, acks, reconnection and fallbacks built in; a Redis adapter scales it out later |
| Database | PostgreSQL 16 + Prisma | Relational data with hard invariants (one DM per pair, idempotent sends); typed queries and migrations |
| Validation | zod | One schema library for env, REST input and socket payloads |
| Auth | JWT in an httpOnly cookie, bcryptjs | Same credential for REST and the socket handshake; not readable by injected scripts |
| Hardening | helmet, cors, express-rate-limit | Secure headers, a single allowed origin, login brute-force protection |
| Logging | pino + pino-http | Fast structured JSON logs with request ids; bodies and cookies never logged |
| Web | Next.js 15 (App Router), React 19 | File-based routing and a production build pipeline out of the box |
| Styling | Tailwind CSS 4 | Consistent, responsive UI without a component library |
| Data fetching | TanStack Query | Caching, infinite pagination and optimistic updates; socket events write into the same cache |
| Tests | Vitest | Fast, native ES modules, no config |

## Setup

Needs Node 20 (`nvm use`) and Docker.

```bash
npm install
cp apps/server/.env.example apps/server/.env && cp apps/web/.env.example apps/web/.env.local
docker compose up -d                         # PostgreSQL on localhost:5433
npm run db:migrate && npm run db:seed
npm run dev                                  # web → http://localhost:3000, API → http://localhost:4000
```

Set `JWT_SECRET` in `apps/server/.env` to a random string of at least 32 characters (for example `openssl rand -hex 32`). The server refuses to start if any env variable is missing or invalid.

Other scripts: `npm test` (server unit tests) and `npm run lint` (both apps).

## Demo accounts

All accounts use the password **`Password123!`**.

| Email | Name | Seeded in |
|---|---|---|
| `alice@cic.test` | Alice Wanjiru | DM with Bob (40 messages), Claims Team (owner) |
| `bob@cic.test` | Bob Otieno | DM with Alice, Claims Team |
| `carol@cic.test` | Carol Njeri | Claims Team |
| `dave@cic.test` | Dave Mwangi | — (use him to start a new chat) |

`npm run db:seed` can be re-run at any time to reset the demo data.

## Demo with two browsers

The session is a cookie, so each user needs a separate browser profile: use a normal window plus an incognito/private window, or two different browsers.

1. **Window A:** sign in as **alice**. **Window B (incognito):** sign in as **bob**.
2. **Presence:** each sees the other's green dot in the DM. Close window B and Alice's header changes to "Last seen just now".
3. **Real-time DM:** open *Alice ↔ Bob* in both windows. Messages appear instantly both ways. In the other window the unread badge rises, then clears when the chat is opened.
4. **History:** scroll to the top of the DM and click **Load older messages**. The view stays where you were.
5. **Group:** open **Claims Team** and send a message; the other member sees it with the sender's name.
6. **New chat:** as Alice, click **New chat**, then either message Dave directly, or pick Bob + Dave, name the group and create it. It appears for them immediately.
7. **Resilience:** stop the server (Ctrl+C) and a "Reconnecting…" banner appears. A message sent now shows *Failed to send · Retry* after 5s. Restart the server: the banner clears and both windows refetch to fill any gap. (Unsent messages are dropped on reconnect; see the known gaps.)
8. **Mobile:** use the browser's device toolbar (~400px wide). The list and the chat show one at a time, with a back button.

## Project structure

```
.
├── apps/
│   ├── server/
│   │   ├── prisma/            schema, migrations, seed
│   │   └── src/
│   │       ├── config/        env validation (zod)
│   │       ├── lib/           prisma, logger, AppError, jwt, session cookie, validation helpers
│   │       ├── middleware/    authenticate, validate, rate limiters, request logger, errors
│   │       ├── modules/       auth, users, conversations, messages (routes → controller → service → repository)
│   │       ├── realtime/      Socket.IO setup, auth, presence store, notifier, event handlers
│   │       ├── services.js    composition root: wires repositories + realtime hooks into services
│   │       ├── app.js         Express app (no listen)
│   │       └── server.js      HTTP + Socket.IO bootstrap, graceful shutdown
│   └── web/
│       └── src/
│           ├── app/           routes: /login, /chat, /chat/[conversationId]
│           ├── components/    ui (Button, Input, Dialog), chat, auth
│           ├── hooks/         data hooks (conversations, messages, send) and UI hooks
│           ├── providers/     Query, Auth, Socket, Presence contexts
│           └── lib/           API client, socket client, event names, cache updaters, formatting
├── docs/                      architecture, decisions, production readiness
├── docker-compose.yml         PostgreSQL 16
└── CLAUDE.md                  conventions for contributors and AI assistants
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md): system and layer diagrams, ERD, sequence diagrams, REST API and socket event reference
- [Design decisions](docs/DECISIONS.md): the main trade-offs and why
- [Production readiness](docs/PRODUCTION_READINESS.md): what's done, known gaps, and the roadmap to production
