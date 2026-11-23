# Architecture

Enterprise chat: authentication, real-time 1:1 and group messaging, history, presence.
Design rationale lives in [DECISIONS.md](./DECISIONS.md).

## High-level design

```mermaid
flowchart TB
  Client["Web client (Next.js)<br/>React UI in the browser"]
  subgraph Server["Node.js server"]
    REST["REST API<br/>Login, chats, history"]
    RT["Realtime gateway (Socket.IO)<br/>Messages, presence"]
    SVC["Shared service layer<br/>Auth, conversations, messages"]
  end
  DB[("PostgreSQL<br/>Users, chats, messages")]
  Redis[("Redis — production add-on<br/>Presence, multi-server")]
  Client -- "HTTPS (REST)" --> REST
  Client <-- "WebSocket" --> RT
  REST --> SVC
  RT --> SVC
  SVC --> DB
  SVC -.-> Redis
```

- REST and the WebSocket gateway share the **same services**, so business rules live in one place.
- The prototype keeps presence in memory on a single server. Redis is the scale-out path (Socket.IO adapter + shared presence).

## Low-level design (layers)

```mermaid
flowchart TB
  H["HTTP request"] --> MW["Middleware<br/>Auth cookie, validation"] --> C["Controllers<br/>Read request, reply"]
  S["Socket event"] --> SMW["Socket middleware<br/>JWT on handshake"] --> SH["Socket handlers<br/>Ack, emit to rooms"]
  C --> SV["Services<br/>Business rules, membership checks"]
  SH --> SV
  SV --> R["Repositories<br/>Database queries via Prisma"] --> PG[("PostgreSQL")]
```

| Layer | Responsibility | Must not |
|---|---|---|
| Routes / middleware | Wire endpoints, authenticate, validate input (zod) | Contain business logic |
| Controllers / socket handlers | Read input, call one service method, reply | Touch Prisma |
| Services | Business rules, permission checks, throw `AppError` | Know about HTTP or sockets |
| Repositories | Prisma queries | Make decisions |

## Data model

```mermaid
erDiagram
  USERS ||--o{ CONVERSATION_MEMBERS : joins
  CONVERSATIONS ||--|{ CONVERSATION_MEMBERS : has
  CONVERSATIONS ||--o{ MESSAGES : contains
  USERS ||--o{ MESSAGES : sends
  USERS ||--o{ CONVERSATIONS : creates

  USERS {
    uuid id PK
    string email UK "stored lowercase"
    string display_name
    string password_hash
    timestamptz last_seen_at "nullable"
    timestamptz created_at
  }
  CONVERSATIONS {
    uuid id PK
    string type "direct | group"
    string name "nullable, groups only"
    string direct_key UK "nullable, sorted user ids joined by ':'"
    uuid created_by_id FK
    timestamptz last_message_at "nullable"
    timestamptz created_at
  }
  CONVERSATION_MEMBERS {
    uuid conversation_id PK, FK
    uuid user_id PK, FK "indexed"
    string role "owner | member"
    timestamptz last_read_at "nullable"
    timestamptz joined_at
  }
  MESSAGES {
    uuid id PK
    uuid conversation_id FK "index (conversation_id, created_at)"
    uuid sender_id FK "unique (sender_id, client_msg_id)"
    text body
    string client_msg_id
    timestamptz created_at
  }
```

- `direct_key` UNIQUE: a pair of users can only ever have one DM.
- `(sender_id, client_msg_id)` UNIQUE: retried sends are idempotent.
- `(conversation_id, created_at)` index: serves history pagination and "latest message" lookups.
- Deleting a conversation cascades to its members and messages.

## Send message

```mermaid
sequenceDiagram
  participant C as Client
  participant H as messageHandlers
  participant S as messagesService
  participant R as messagesRepository
  participant Room as Room conv:{id}

  C->>C: Show message as "sending" (clientMsgId = uuid)
  C->>H: emit message:send {conversationId, body, clientMsgId} + ack
  H->>H: Validate payload (zod)
  H->>S: sendMessage(userId, payload)
  S->>S: Check sender is a member
  S->>R: Save message (idempotent on senderId + clientMsgId)
  R->>R: Update conversation.lastMessageAt
  R-->>S: message
  S-->>H: message
  H->>Room: emit message:new
  H-->>C: ack {ok: true, message}
  C->>C: Mark message "sent"
  Note over C,H: On reconnect the client refetches messages to fill any gaps.
```

## Connect + presence

```mermaid
sequenceDiagram
  participant C as Client
  participant A as socketAuth
  participant CH as connectionHandlers
  participant P as presenceStore
  participant U as usersService
  participant O as Other clients

  C->>A: Connect (httpOnly auth cookie)
  A->>A: Verify JWT (reject if invalid)
  A->>CH: connection
  CH->>CH: Join user:{id} and conv:{id} for each membership
  CH->>P: connect(userId) — counts sockets per user (multi-tab)
  alt First socket for this user
    CH->>O: broadcast presence:update {userId, online: true}
  end
  C--)CH: disconnect
  CH->>P: disconnect(userId)
  alt Last socket for this user
    CH->>U: save lastSeenAt
    CH->>O: broadcast presence:update {userId, online: false, lastSeenAt}
  end
```

## REST API

_To be filled in during the next phase._

## Socket events

_To be filled in during the next phase._
