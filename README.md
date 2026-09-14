# Journally API

REST API for **Journally**, a personal journaling app for managing users, collections, and journal entries.

The API is built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**. It includes JWT authentication, request validation middleware, Swagger/OpenAPI documentation, and a WebSocket endpoint for editor autosave.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Frontend](#frontend)
- [Available Scripts](#available-scripts)
- [Database](#database)
- [Swagger Documentation](#swagger-documentation)
- [Entry WebSocket](#entry-websocket)
- [Observability](#observability)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [ERD](#erd)
- [Public Repository Checklist](#public-repository-checklist)

## Features

- User registration and login.
- JWT authentication with `x-access-token` and `x-refresh-token` headers.
- Session renewal with 15-minute access tokens and 30-day refresh tokens.
- CRUD operations for journal entries.
- CRUD operations for collections.
- JSON-based entry descriptions, designed to store Tiptap editor content.
- Paginated lists with search and sorting support.
- Request validation with `express-validator`.
- Interactive API documentation with Swagger UI.
- PostgreSQL access through Prisma ORM.
- WebSocket autosave for journal entries.

## Tech Stack

- Node.js `22.x`
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JSON Web Tokens
- bcrypt
- Swagger/OpenAPI
- ws
- Sentry — error tracking, tracing, and selective operational logs
- Winston — structured application and error logging
- Vercel — deployment and runtime log visibility
- Jest + Supertest

## Requirements

- Node.js `22.x`
- pnpm
- Docker Desktop (or Docker Engine with Docker Compose) for the local development database
- Environment variables configured

## Installation

```bash
git clone https://github.com/SabriBere/Journally-API.git
cd Journally-API
pnpm install
cp .env.example .env.dev
pnpm db:start
pnpm generate
pnpm db:migrate:dev
pnpm dev
```

This starts PostgreSQL in Docker, applies every committed migration, and runs
the API in watch mode. A successful startup exposes the REST API at
`http://localhost:8080/api` and Swagger UI at
[`http://localhost:8080/swagger`](http://localhost:8080/swagger).

Stop the local database when you finish:

```bash
pnpm db:stop
```

## Environment Variables

Local development example:

```env
NODE_ENV=development
PORT=8080
SERVER=localhost

DATABASE_URL="postgresql://postgres:postgres@localhost:5433/journally_dev?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/journally_dev?schema=public"

JWT_SECRET=replace_with_a_local_access_token_secret
JWT_REFRESH_SECRET=replace_with_a_local_refresh_token_secret

SALT_ROUND=10
ALLOWED_ORIGINS=http://localhost:3000

SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1
```

Production example:

```env
NODE_ENV=production
PORT=8080
SERVER=your-api-domain.com

DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

JWT_SECRET=replace_with_a_secure_secret
JWT_REFRESH_SECRET=replace_with_a_secure_refresh_secret

SALT_ROUND=10
ALLOWED_ORIGINS=https://your-frontend-domain.com

SENTRY_DSN=replace_with_your_sentry_dsn
SENTRY_TRACES_SAMPLE_RATE=0.1
```

Configuration variables:

| Variable                    | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`                  | Enables development-only behavior such as Swagger UI when set to `development`. |
| `PORT`                      | HTTP and WebSocket server port. Defaults to `8080`.                             |
| `SERVER`                    | Hostname displayed in the local Swagger server URL.                             |
| `ALLOWED_ORIGINS`           | Comma-separated frontend origins accepted by CORS.                              |
| `SALT_ROUND`                | bcrypt work factor used when hashing passwords.                                 |
| `DATABASE_URL`              | PostgreSQL connection used by the API runtime.                                  |
| `DIRECT_URL`                | Direct PostgreSQL connection used by Prisma migrations.                         |
| `JWT_SECRET`                | Secret used to sign 15-minute access tokens.                                    |
| `JWT_REFRESH_SECRET`        | Independent secret used to sign 30-day refresh tokens.                          |
| `SENTRY_DSN`                | Optional Sentry project DSN. Sentry is disabled when this value is absent.      |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional Sentry trace sampling rate. Defaults to `0.1`.                         |

The WebSocket server uses the same HTTP server and `PORT` as the REST API. There
is no separate socket port in the current implementation.

`.env.dev`, `.env.prod`, `.env.test`, and other real environment files are
ignored by Git. The committed `.env.example` and `.env.test.example` files
contain placeholders or local-only Docker credentials, which must not be reused
in production.

## Frontend

The companion Next.js application lives in
[SabriBere/Journally-Web](https://github.com/SabriBere/Journally-Web).
For local integration, run the frontend on an origin listed in
`ALLOWED_ORIGINS` and configure its `NEXT_PUBLIC_API_URL` as
`http://localhost:8080/api`.

## Available Scripts

```bash
pnpm dev
```

Starts the development server using `.env.dev`. Start PostgreSQL and apply
pending migrations before running it.

```bash
pnpm db:start
pnpm db:status
pnpm db:stop
pnpm db:logs
```

Starts, inspects, stops, or follows the logs of the PostgreSQL 17 container
defined in `compose.yaml`. The database is available on local port `5433`, and
its data is persisted in the Docker volume `journally-api_postgres_data`.

The first `pnpm db:start` downloads the PostgreSQL image and creates the
development database automatically. Wait for the container to report a healthy
status before applying migrations. Stopping the service preserves its data.
Avoid `docker compose down -v` unless you intentionally want to delete the local
development database.

```bash
pnpm db:migrate:dev
```

Runs Prisma migrations against the `.env.dev` database.

```bash
pnpm db:migrate:deploy
```

Runs Prisma migrations in deployment environments.

```bash
pnpm generate
```

Generates the Prisma client.

```bash
pnpm migrate
```

Creates a new Prisma development migration using `.env.dev`. Prisma prompts for
the migration name. Use this command only after intentionally changing
`prisma/schema.prisma`; use `pnpm db:migrate:dev` to apply existing migrations.

```bash
pnpm build
```

Compiles TypeScript into `dist`.

```bash
pnpm start
```

Starts the compiled API from `dist/src/index.js`.

```bash
pnpm test
```

Runs the Jest test suite.

## Database

Prisma is the source of truth for the application schema. The production database is PostgreSQL hosted on Supabase.

The Prisma schema defines the following models:

- `User`
- `Setting`
- `Collection`
- `Post`

Journally calls user-facing content “journal entries”; internally, journal
entries are represented by the Prisma `Post` model and `/api/post` endpoints.

`Post.description` is a `Json` field. It stores rich editor content in the JSON structure produced by Tiptap, preserving paragraphs, nodes, marks, and formatted text.

Database migrations live in:

```txt
prisma/migrations
```

The local and deployment migration commands are documented in
[Available Scripts](#available-scripts).

### Seed data

The project does not require or provide seed data. A fresh migration produces
an empty database; create the first account through `POST /api/users/register`,
Swagger UI, or the Journally Web registration screen.

## Swagger Documentation

Swagger UI is available when the server is running:

```txt
http://localhost:8080/swagger
```

If you use a different `PORT`, update the URL accordingly.

Swagger configuration lives in:

- `src/swagger/swagger.ts`
- `src/swagger/swaggerEntries.ts`

Swagger documents reusable schemas, authentication headers, query parameters, request bodies, and the main API responses.

When calling `POST /api/users/login` from Swagger UI, the `x-access-token` and `x-refresh-token` headers returned by the API can be used to authorize protected endpoints.

## Entry WebSocket

The WebSocket endpoint listens for entry changes and autosaves editor content.

Local URL:

```txt
ws://localhost:8080/entries
```

Production URL:

```txt
wss://your-api-domain.com/entries
```

Send the access token as the second WebSocket subprotocol so it is not exposed in URLs or proxy logs:

```ts
new WebSocket("wss://your-api-domain.com/entries", [
    "access-token",
    accessToken,
]);
```

Autosave message:

```json
{
    "type": "entry:autosave",
    "postId": 1,
    "title": "Updated entry",
    "description": {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Content from Tiptap"
                    }
                ]
            }
        ]
    },
    "clientRequestId": "optional-client-id"
}
```

Successful response:

```json
{
    "type": "entry:saved",
    "data": {
        "status": 200,
        "post": {}
    },
    "clientRequestId": "optional-client-id"
}
```

Error response:

```json
{
    "type": "entry:error",
    "error": true,
    "data": "Error message"
}
```

The socket verifies that the post belongs to the authenticated user before saving changes.

## Observability

Journally API separates observability responsibilities to keep signals useful
and avoid reporting the same event through every tool:

```mermaid
flowchart TD
    A[Application] --> B[Expected error]
    A --> C[Unexpected error]
    A --> D[Strategic event]
    B --> E[AppError or known middleware error]
    E --> F[Safe HTTP 4xx]
    C --> G[Sentry Issue]
    C --> H[Winston]
    H --> I[Vercel Runtime Logs]
    C --> J[Generic HTTP 500]
    D --> K[Sentry Logs]
```

Both Winston and Sentry attach the current environment using Vercel's
environment when available, then `NODE_ENV`, with `development` as the fallback.

### Error tracking

Expected domain failures use `AppError` and return a safe HTTP 4xx response
without creating a Sentry Issue. Known JSON parser and body-processing failures
are classified through a closed mapping and follow the same safe 4xx path.

Unexpected exceptions reach the centralized Express error boundary. Sentry
records the original exception as an Issue with its stack trace, Winston writes
one structured error to the console for Vercel Runtime Logs, and the client
receives a generic HTTP 500 response. Internal exception messages are not
included in that response.

### Application logging

Winston provides the API's general technical and error logging independently of
Sentry Logs. It writes through a console transport, which makes the output
available in Vercel Runtime Logs. Development output is human-readable,
production output is structured JSON, and logging is silent during tests.

### Selective Sentry Logs

Sentry Logs is reserved for low-frequency operational or security-relevant
events which do not represent unexpected exceptions. It is not an access
logger, a replacement for Winston, a mirror of console output, or a duplicate
of Sentry Issues.

The currently instrumented events are:

- `user_session_revoked`: logout removed a persisted refresh session.
- `refresh_session_identity_mismatch`: a valid refresh request referenced a
  persisted session owned by a different user identity.
- `websocket_message_rate_limited`: an authenticated WebSocket connection
  exceeded the autosave message limit.

These events use minimal structured metadata such as operation, status, reason
code, count, and transport when relevant. The Sentry SDK is configured with
`sendDefaultPii: false`. The instrumentation is designed not to add passwords,
JWTs, refresh tokens or their hashes, authorization headers, cookies, complete
request bodies, or journal-entry content to these events.

## Project Structure

```txt
.
├── .github/workflows/ci-cd.yml
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── collectionsControllers.ts
│   │   ├── postControllers.ts
│   │   └── usersControllers.ts
│   ├── db/db.ts
│   ├── errors
│   │   ├── AppError.ts
│   │   └── middlewareErrors.ts
│   ├── loggers
│   │   ├── logger.ts
│   │   ├── observabilityLogger.ts
│   │   └── sentry.ts
│   ├── middlewares
│   │   ├── authenticatedToken.ts
│   │   ├── collectionValidation.ts
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   ├── postValidation.ts
│   │   ├── queryValidation.ts
│   │   └── userValidation.ts
│   ├── routes
│   │   ├── collections.ts
│   │   ├── post.ts
│   │   ├── routes.ts
│   │   └── users.ts
│   ├── services
│   │   ├── collectionServices.ts
│   │   ├── postServices.ts
│   │   └── usersServices.ts
│   ├── sockets/postSocket.ts
│   ├── swagger
│   │   ├── swagger.ts
│   │   └── swaggerEntries.ts
│   ├── utils/auth.ts
│   └── index.ts
├── tests
│   ├── helpers
│   │   ├── helperTest.ts
│   │   └── testDatabase.ts
│   ├── collection.test.ts
│   ├── collectionFindOneErrors.test.ts
│   ├── observability.test.ts
│   ├── post.test.ts
│   ├── postErrors.test.ts
│   ├── postSocket.test.ts
│   ├── user.test.ts
│   └── userErrors.test.ts
├── .env.test.example
├── compose.test.yaml
└── jest.config.ts
```

The project follows a layered structure:

```txt
HTTP -> Controller -> Service -> Prisma -> Database
```

### Controllers

Controllers receive Express requests, read `req.body`, `req.query`, or `req.params`, check validation results, and delegate business logic to services.

### Services

Services contain the main business logic. They check entity ownership and
existence, prepare data, run Prisma operations, and raise domain errors when
expected business rules are not satisfied.

### Prisma / DB

`src/db/db.ts` exports the Prisma client used by the service layer.

### Middlewares

Middlewares handle JWT authentication, refresh token authentication, request validation, and not-found responses.

### Swagger

Swagger centralizes the OpenAPI documentation and serves the browser UI.

## Testing

The REST integration suite uses Jest, `ts-jest`, and Supertest. Tests exercise
the Express application against PostgreSQL through Prisma and run with one Jest
worker to avoid interference in the shared test database.

Shared fixtures live in `tests/helpers/helperTest.ts`.
`tests/helpers/testDatabase.ts` protects cleanup operations by requiring
`NODE_ENV=test` and allowing only the `journally_test` and `journally_ci`
database names.

To run the suite locally:

```bash
cp .env.test.example .env.test
pnpm db:test:start
pnpm db:test:push
pnpm test
pnpm db:test:stop
```

The tests cover users, posts, and collections, including authentication,
validation, ownership boundaries, pagination, post CRUD, collection CRUD, and
collection assignment and deletion behavior. Observability tests also verify
the classification of expected and unexpected errors, propagation of original
exceptions, selective Sentry capture and application events, and the absence of
duplicate reporting for expected failures.

CI provisions a PostgreSQL 17 service, applies committed Prisma migrations, and
runs the suite serially with `pnpm test:ci`. The WebSocket message-limit behavior
has focused automated coverage; full WebSocket autosave integration testing
remains a gap.

## ERD

The diagram below was exported from Supabase after applying the Prisma migrations. It reflects the current PostgreSQL tables, including Prisma's internal `_prisma_migrations` table.

![Supabase ERD](./docs/supabase-erd.png)

Notes:

- `_prisma_migrations` is managed by Prisma and should not be edited manually.
- `Post.description` is stored as JSON to support Tiptap editor content.
- The Prisma schema in `prisma/schema.prisma` remains the source of truth for application models and migrations.

## Public Repository Checklist

Before making this repository public:

- Keep `.env`, `.env.dev`, and `.env.prod` ignored and out of Git history.
- Use only placeholders in `.env.example`.
- Rotate any JWT or database secrets that were shared outside the hosting provider.
- Store production secrets only in the hosting provider dashboard.
- Review screenshots and diagrams before committing them. Do not include connection strings, passwords, tokens, or internal project credentials.
