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
- **Decision:** Page backwards with a cursor (the oldest loaded message's `createdAt`/`id`) using the `(conversation_id, created_at)` index.
- **Trade-off:** You can't jump to page N, but pages stay stable as new messages arrive (offset pagination would skip or repeat rows), and each page is a cheap index seek.

## 8. JavaScript instead of TypeScript

- **Context:** A time-boxed interview prototype.
- **Decision:** Plain JavaScript (ES modules) with zod validating every boundary (env, REST, sockets) and JSDoc where intent isn't obvious.
- **Trade-off:** Faster to write, but there's no compile-time type checking. Runtime validation covers the riskiest place (untrusted input). TypeScript would be the first step towards production.
