# Production readiness

This is a time-boxed prototype. This page sets out what is actually built, what is missing, and how it would get to production.

## 1. Implemented in this prototype

**Product**
- Register, sign in and sign out. The session lasts 8h in an httpOnly, SameSite=Lax cookie (Secure in production).
- One-to-one and group chats. Each pair of users gets exactly one DM, enforced by a unique `direct_key`. Groups have an owner and need ≥2 other members.
- Real-time delivery over Socket.IO, with the sender's message shown immediately (*sending → sent → failed + retry*).
- History with cursor pagination on `(created_at, id)`; "Load older" keeps your scroll position.
- Unread counts per conversation (from `last_read_at`), cleared when a chat is opened.
- Online/offline presence that works with several tabs open (sockets counted per user), and "last seen".
- Responsive UI: list and chat side by side on desktop, one at a time on mobile. Loading skeletons, empty states, inline errors with retry, a reconnecting banner.
- Accessibility basics from Mantine: labelled inputs, focus states, accessible modal; the message list is a `role="log"` live region.
- Virtualised message list (react-virtuoso), so long histories stay fast.

**Engineering**
- Layered server: routes → middleware → controller → service → Prisma. REST and sockets share the same services. No repository layer (see [DECISIONS.md](./DECISIONS.md) #9).
- Services never import Socket.IO; they emit domain events that the realtime layer turns into socket pushes.
- Leans on established libraries instead of custom code: Mantine, ky, dayjs, react-virtuoso, rate-limiter-flexible, Prisma's cursor pagination and `omit`.
- One-command local stack: `docker compose up -d --build` (Postgres, server, web).
- Every input is validated with zod: env (the server won't start if it's invalid), REST bodies/params/queries, socket payloads.
- Consistent errors: `AppError` → `{ error: { code, message } }`, with no stack traces in responses. Socket handlers always ack and never throw.
- Membership checks on every conversation read and write.
- Sends are idempotent on `(sender_id, client_msg_id)`, including when two identical requests race.
- No N+1: the conversation list takes a fixed handful of queries however many chats there are; the latest message per chat uses `DISTINCT ON`.
- Security basics:
  - helmet headers, a single CORS origin with credentials, a 100kb JSON body limit
  - login rate limit of 5/min per IP; message rate limit of 20 per 10s per user
  - bcrypt password hashes; a dummy compare for unknown emails so login timing doesn't reveal which accounts exist
  - `passwordHash` never leaves the server: Prisma omits it from every query except login
- Structured logs (pino) with request ids. Bodies, passwords and cookies are never logged, and redaction backs this up.
- Graceful shutdown: Socket.IO, then HTTP, then Prisma, with a forced exit after 10s.
- 8 unit tests on the services with Prisma mocked: membership, idempotency, find-or-create DM.

## 2. Known gaps

| Area | Gap | Impact |
|---|---|---|
| Identity | No SSO. Local email + password only; no MFA | Not acceptable for an enterprise directory |
| Sessions | No refresh-token rotation or server-side revocation. JWTs can't be revoked before they expire, and sockets aren't re-checked after the handshake | A stolen cookie stays valid for up to 8h; a disabled user keeps an open socket |
| Messaging | No attachments, no edit/delete, no reactions, threads, mentions or search | Core feature gaps |
| Read state | Only a per-user `last_read_at`. No per-message read receipts ("seen by") | Senders can't see who has read their message |
| Groups | No add/remove members, rename, or leave | Groups are fixed once created |
| Notifications | No push or email notifications | Users miss messages when the tab is closed |
| Typing | No typing indicator | Minor UX gap |
| Scale | Presence and both rate limiters are in-memory | **One server node only.** Restarting resets presence; a second node would see a different state |
| Privacy | Presence updates go to every connected user | Should be limited to people who share a conversation |
| Rate limiting | The login limit is per IP | Users behind one corporate NAT share a single quota |
| Offline UX | Unsent (failed) messages are held in memory only and disappear on reconnect or reload | The user has to retype them |
| Testing | 8 unit tests on the services; no tests for controllers, database queries, sockets, or the web app | Regressions are likely as features grow |
| E2E | No end-to-end tests; the two-browser flow is checked by hand | — |
| Types | JavaScript without types; zod covers runtime boundaries only | Refactors are riskier; contract drift between web and server is caught late |

## 3. Production roadmap

### Identity and access
- SSO via OIDC with **Microsoft Entra ID (Azure AD)**; the app gets no passwords.
- **SCIM** provisioning: create, update and deactivate users from the directory, and cut sessions on deactivation.
- **MFA** enforced by the identity provider (conditional access).
- **RBAC** (member, group admin, compliance officer, org admin) and an **admin console** for users, groups, retention and audit.
- Short-lived access tokens with rotating refresh tokens. Sessions can be revoked, and are re-checked on socket reconnects and at intervals.

### Scalability
- Several stateless server nodes behind a load balancer with **sticky sessions** (needed by Socket.IO's polling transport).
- **Socket.IO Redis adapter** for fan-out across nodes; **Redis-backed presence** and rate limiters, replacing the in-memory `presenceStore` (same three-function interface) and swapping `RateLimiterMemory` for `RateLimiterRedis`.
- **PgBouncer** for connection pooling; **read replicas** for history and search reads.
- **Partition the `messages` table** by time (for example monthly) to keep indexes small and make retention cheap.
- A **queue** (BullMQ to start, Kafka at scale) after each message is saved, for notifications, search indexing and audit events, so the send path stays fast.
- **Attachments** in object storage (S3/Azure Blob) via **short-lived signed URLs**, with **malware scanning** before release, plus size and type limits.

### Security and data protection
- **TLS everywhere**, including between services and to the database; HSTS.
- **Encryption at rest** for the database, backups and object storage, with managed keys.
- **Secrets manager** (Azure Key Vault / AWS Secrets Manager); nothing secret in env files or images.
- A strict **Content Security Policy** on the web app; a **CSRF review** (SameSite=Lax plus an origin check; add CSRF tokens if cookies ever go cross-site).
- An **audit log** of sign-ins, admin actions and exports, written append-only.
- **Retention policies and legal hold** for eDiscovery (no end-to-end encryption, by design; see [DECISIONS.md](./DECISIONS.md)).
- **DLP** scanning of messages and attachments through the event queue.
- **Kenya Data Protection Act 2019** compliance:
  - data minimisation (collect only the profile fields that are needed)
  - lawful basis and privacy notice
  - data subject rights (access, correction, deletion and export workflows)
  - **data residency** (host in-region or document cross-border safeguards)
  - breach notification process; ODPC registration
- An external **penetration test** before launch, then yearly.

### Reliability
- Separate **liveness and readiness** probes (readiness checks the database and Redis).
- **Zero-downtime deploys**: rolling or blue-green, backward-compatible migrations (expand → migrate → contract), socket connections drained on shutdown (already handled).
- Automated **backups with point-in-time recovery**, with regular restore drills.
- A **multi-AZ** managed PostgreSQL.
- **SLOs**, for example 99.9% availability and p95 send-to-deliver < 300 ms, with error budgets.

### Observability
- **Sentry** on web and server, with request ids linking logs and errors.
- **Prometheus + Grafana**: connected sockets, sends per second, send latency p95, ack failures, error rate, DB pool saturation; alerts on SLO burn.
- **OpenTelemetry** tracing across HTTP → service → database and socket event → service.
- Central log storage (for example Loki/ELK), keeping the existing redaction rules.

### Delivery
- **CI/CD**: lint, unit tests, build, then Docker images, with deploys to staging and production after a manual approval.
- A **staging** environment that mirrors production, seeded with synthetic data.
- **Playwright E2E** tests for sign-in, DM, group, presence, reconnect and retry, and the mobile layout.
- Add tests for the service queries against a real Postgres (Testcontainers) and for the socket handlers.
- **Migrate to TypeScript**, sharing the API and event types between web and server, generated from the zod schemas.

### Extensions
- A **helpdesk bot** (Dialogflow) through a webhook that calls the existing transport-agnostic `messagesService.send`.
- A **Twilio bridge** so external contacts can be reached over WhatsApp and SMS.
- **Full-text search** (Postgres `tsvector` to start, OpenSearch at scale), always filtered by membership.
- **PWA + Web Push** for installable mobile use and notifications while the tab is closed.
