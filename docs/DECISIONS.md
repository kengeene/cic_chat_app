# Design decisions

Short records: **Context / Decision / Trade-off.**

## 1. Separate Node server instead of Next.js API routes

- **Context:** Chat needs long-lived WebSocket connections and in-process presence state.
- **Decision:** A standalone Express + Socket.IO server; Next.js is UI only.
- **Trade-off:** Two processes and CORS/cookie setup, in exchange for a server that can hold sockets and scale independently of the frontend (serverless API routes cannot).

## 2. Socket.IO instead of raw WebSocket

- **Context:** We need rooms, acknowledgements, reconnection, and fallback transports.
- **Decision:** Socket.IO.
- **Trade-off:** A custom protocol on top of WebSocket and a client library dependency, instead of hand-building rooms, acks, heartbeats and reconnection. A Redis adapter gives multi-server fan-out later.

## 3. PostgreSQL instead of MongoDB

- **Context:** The data is relational (users ↔ memberships ↔ conversations ↔ messages) with hard invariants.
- **Decision:** PostgreSQL via Prisma.
- **Trade-off:** Schema migrations are required. In return we get unique constraints (one DM per pair, idempotent sends), transactions, and joins for membership checks.

## 4. JWT in an httpOnly cookie instead of localStorage

- **Context:** The token must authenticate both REST calls and the Socket.IO handshake.
- **Decision:** A signed JWT in an `httpOnly`, `SameSite` cookie, sent automatically on both channels.
- **Trade-off:** Not readable by injected scripts (XSS can't steal it), but needs CORS with credentials and CSRF awareness (SameSite). Stateless JWTs can't be revoked before expiry, so we keep them short-lived.

## 5. No end-to-end encryption

- **Context:** Enterprise chat must support compliance: eDiscovery, retention policies, DLP scanning.
- **Decision:** No E2EE. Use TLS in transit and encryption at rest (database/disk).
- **Trade-off:** The server operator can read messages. That is a requirement for compliance, not a flaw, but it makes access control and audit on the server critical.

## 6. Idempotent sends with `clientMsgId`

- **Context:** Flaky networks cause retries, and a retry must not create duplicate messages.
- **Decision:** The client generates a UUID per message; `UNIQUE(sender_id, client_msg_id)` makes a retry return the existing row.
- **Trade-off:** The client generates and tracks one extra id, in exchange for exactly-once storage and simple optimistic UI ("sending" → "sent").

## 7. Cursor pagination instead of offset

- **Context:** History grows while users scroll, and new messages arrive in real time.
- **Decision:** Page backwards with Prisma's built-in cursor (the oldest loaded message's `id`), ordered by `(created_at, id)` and served by the `(conversation_id, created_at)` index.
- **Trade-off:** You can't jump to page N, but pages stay stable as new messages arrive (offset pagination would skip or repeat rows), and each page is a cheap index seek.

## 8. JavaScript instead of TypeScript

- **Context:** A time-boxed interview prototype.
- **Decision:** Plain JavaScript (ES modules) with zod validating every boundary (env, REST, sockets) and JSDoc where intent isn't obvious.
- **Trade-off:** Faster to write, but there's no compile-time type checking. Runtime validation covers the riskiest place (untrusted input). TypeScript would be the first step towards production.

## 9. No repository layer: Prisma is the data-access layer

- **Context:** The first version wrapped almost every Prisma call in a one-line repository function and wired everything together through factories.
- **Decision:** Services call `prisma` directly. Only genuinely complex queries (raw SQL for the latest message and unread counts) get their own helper. Side effects reach Socket.IO through an in-process `EventEmitter`, not injected callbacks.
- **Trade-off:** Services are tied to Prisma, and tests mock the Prisma module instead of injecting fakes. In return there's about 150 fewer lines of pass-through code. Swapping the ORM is unlikely, and Prisma already provides the type-safe, mockable data API a repository would give us.

## 10. Mantine instead of Tailwind and hand-built components

- **Context:** The UI had hand-built buttons, inputs, dialogs, avatars, skeletons, a responsive sidebar and form state, plus Tailwind for styling.
- **Decision:** Use Mantine for everything: components, `AppShell` (responsive layout), `@mantine/form`, `@mantine/notifications`. Remove Tailwind so there's one styling system. Use `react-virtuoso` for the message list, `ky` for HTTP and `dayjs` for dates.
- **Trade-off:** A larger dependency and an opinionated look, in exchange for accessible, tested components (focus traps, ARIA, autosizing textareas) and far less custom code to explain and maintain.
