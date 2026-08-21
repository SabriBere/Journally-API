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
- [Main Endpoints](#main-endpoints)
- [Entry WebSocket](#entry-websocket)
- [Deployment](#deployment)
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

- Node.js `>=20.6.0`
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JSON Web Tokens
- bcrypt
- Swagger/OpenAPI
- ws
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
```

Notes:

- `DATABASE_URL` is used by the application runtime. In Supabase serverless deployments, use the transaction pooler URL.
- `DIRECT_URL` is used by Prisma migrations. In Supabase, use the direct/session connection URL.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be strong production secrets.
- `ALLOWED_ORIGINS` is a comma-separated list of allowed frontend origins.
- `SERVER` and `PORT` are used by the Swagger server configuration.
- The WebSocket server runs on the same HTTP server and port as the REST API. There is no separate socket port in the current implementation.
- Never commit real `.env` files or production credentials. The committed `.env.example` file must only contain placeholders.

Required variables:

| Variable             | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`           | Enables development-only behavior such as Swagger UI when set to `development`. |
| `PORT`               | HTTP and WebSocket server port. Defaults to `8080`.                             |
| `SERVER`             | Hostname displayed in the local Swagger server URL.                             |
| `ALLOWED_ORIGINS`    | Comma-separated frontend origins accepted by CORS.                              |
| `SALT_ROUND`         | bcrypt work factor used when hashing passwords.                                 |
| `DATABASE_URL`       | PostgreSQL connection used by the API runtime.                                  |
| `DIRECT_URL`         | Direct PostgreSQL connection used by Prisma migrations.                         |
| `JWT_SECRET`         | Secret used to sign 15-minute access tokens.                                    |
| `JWT_REFRESH_SECRET` | Independent secret used to sign 30-day refresh tokens.                          |

`.env.dev`, `.env.prod`, and other real environment files are ignored by Git.
Only `.env.example` is committed. Local Docker credentials are intentionally
non-sensitive and must not be reused in production.

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

`Post.description` is a `Json` field. It stores rich editor content in the JSON structure produced by Tiptap, preserving paragraphs, nodes, marks, and formatted text.

Database migrations live in:

```txt
prisma/migrations
```

Apply migrations locally with:

```bash
pnpm db:start
pnpm db:migrate:dev
```

Apply migrations in production with:

```bash
pnpm db:migrate:deploy
```

When using Supabase, keep both Prisma database URLs configured:

- `DATABASE_URL`: transaction pooler URL for the application runtime.
- `DIRECT_URL`: direct/session URL for Prisma migrations.

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

## Main Endpoints

All REST routes are mounted under `/api`. The complete and interactive endpoint
reference is available through Swagger UI at
[`http://localhost:8080/swagger`](http://localhost:8080/swagger) while the API is
running. Swagger documents the routes for users, posts, and collections,
including authentication requirements, parameters, request bodies, response
schemas, and examples.

## Entry WebSocket

The WebSocket endpoint listens for entry changes and autosaves editor content.

Local URL:

```txt
ws://localhost:8080/entries?token=<accessToken>
```

Production URL:

```txt
wss://your-api-domain.com/entries?token=<accessToken>
```

The `token` query parameter must be the access token returned by `POST /api/users/login` in the `x-access-token` header.

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

## Deployment

This API uses Supabase as the hosted PostgreSQL database and is deployed on Vercel.

### Supabase

Supabase is used as the hosted PostgreSQL database.

Recommended setup:

- Create a Supabase project.
- Use the transaction pooler connection string as `DATABASE_URL`.
- Use the direct or session connection string as `DIRECT_URL`.
- Run Prisma migrations with `pnpm db:migrate:deploy`.
- Store real connection strings only in local ignored `.env` files or hosting provider environment variables.

Example placeholders:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
```

Do not commit Supabase passwords, project-specific connection strings, or JWT secrets. If a secret is exposed, rotate it in Supabase/Vercel and update the local `.env` files.

### Vercel

Suggested Vercel settings:

```txt
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
Output Directory: leave empty
```

Set production environment variables in the Vercel dashboard. At minimum, configure `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`, `SERVER`, and `SALT_ROUND`.

If this API is deployed on Vercel Hobby, keep source code outside Vercel's reserved root-level `api/` functions directory unless each file is intended to be deployed as an individual Serverless Function.

### Render

Suggested Render Web Service settings:

```txt
Build Command: pnpm install --frozen-lockfile && pnpm generate && pnpm build
Pre-Deploy Command: pnpm db:migrate:deploy
Start Command: pnpm start
```

Set the production environment variables in the Render dashboard.

The API will be available at the Render service URL, and the WebSocket endpoint will use the same domain:

```txt
https://your-service.onrender.com
wss://your-service.onrender.com/entries?token=<accessToken>
```

### Fly.io

Fly.io can also host the API, usually with a `fly.toml` configuration and either a generated Dockerfile or a Node.js build setup.

The app must expose the port provided by `process.env.PORT`, which the current server already supports.

## Project Structure

```txt
src/
├── controllers
│   ├── collectionsControllers.ts
│   ├── postControllers.ts
│   └── usersControllers.ts
├── db
│   └── db.ts
├── middlewares
│   ├── authtenticatedToken.ts
│   ├── notFound.ts
│   ├── postValidation.ts
│   └── userValidation.ts
├── routes
│   ├── colletions.ts
│   ├── post.ts
│   ├── routes.ts
│   └── users.ts
├── services
│   ├── collectionServices.ts
│   ├── postServices.ts
│   └── usersServices.ts
├── sockets
│   └── postSocket.ts
├── swagger
│   ├── swagger.ts
│   └── swaggerEntries.ts
├── utils
│   └── auth.ts
└── index.ts
```

The project follows a layered structure:

```txt
HTTP -> Controller -> Service -> Prisma -> Database
```

### Controllers

Controllers receive Express requests, read `req.body`, `req.query`, or `req.params`, check validation results, and delegate business logic to services.

### Services

Services contain the main business logic. They check entity ownership and existence, prepare data, run Prisma operations, and normalize response payloads.

### Prisma / DB

`src/db/db.ts` exports the Prisma client used by the service layer.

### Middlewares

Middlewares handle JWT authentication, refresh token authentication, request validation, and not-found responses.

### Swagger

Swagger centralizes the OpenAPI documentation and serves the browser UI.

## Testing

The project includes Jest and Supertest dependencies.

Suggested next tests:

- Unit tests for services.
- Integration tests for the main routes.
- Authentication and validation tests.
- WebSocket autosave tests.

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
