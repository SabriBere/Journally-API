# Journally API

REST API for **Journally**, a personal journaling app for managing users, collections, and journal entries.

The API is built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**. It includes JWT authentication, request validation middleware, Swagger/OpenAPI documentation, and a WebSocket endpoint for editor autosave.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
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

- Node.js `>=20.6.0`
- pnpm
- PostgreSQL 17 for the project-local development database, or a hosted PostgreSQL instance
- Environment variables configured

## Installation

```bash
git clone https://github.com/<your-username>/Journally-API.git
cd Journally-API
pnpm install
```

Create a `.env.dev` file for local development.

## Environment Variables

Local development example:

```env
NODE_ENV=development
PORT=8080
SERVER=localhost

DATABASE_URL="postgresql://postgres@localhost:5433/journally_dev?schema=public"
DIRECT_URL="postgresql://postgres@localhost:5433/journally_dev?schema=public"

JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

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
```

Starts, inspects, or stops the persistent project-local PostgreSQL instance on
port `5433`. Its files are preserved in the ignored `.postgres-data/` directory.

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

Creates a new Prisma development migration.

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
pnpm db:migrate:dev
```

Apply migrations in production with:

```bash
pnpm db:migrate:deploy
```

When using Supabase, keep both Prisma database URLs configured:

- `DATABASE_URL`: transaction pooler URL for the application runtime.
- `DIRECT_URL`: direct/session URL for Prisma migrations.

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

All routes are mounted under `/api`.

### Users

| Method   | Route                    | Description                          | Auth    |
| -------- | ------------------------ | ------------------------------------ | ------- |
| `POST`   | `/api/users/register`    | Registers a user                     | No      |
| `POST`   | `/api/users/login`       | Logs in and returns JWT headers      | No      |
| `POST`   | `/api/users/refresh`     | Refreshes access and refresh tokens  | Refresh |
| `PUT`    | `/api/users/update`      | Updates the authenticated password   | Access  |
| `DELETE` | `/api/users/delete/:id`  | Deletes the authenticated user       | Access  |

### Posts

| Method   | Route                                          | Description                              | Auth   |
| -------- | ---------------------------------------------- | ---------------------------------------- | ------ |
| `POST`   | `/api/post/create?collectionId=1`              | Creates a post inside a collection       | Access |
| `POST`   | `/api/post/createOne`                          | Creates a post without a collection      | Access |
| `PUT`    | `/api/post/updateOne?postId=1&collectionId=1`  | Assigns a post to a collection           | Access |
| `PUT`    | `/api/post/autosave?postId=1`                  | Autosaves post title or description      | Access |
| `GET`    | `/api/post/findOne?postId=1`                   | Finds one post by id                     | No     |
| `GET`    | `/api/post`                                    | Lists the authenticated user's posts     | Access |
| `DELETE` | `/api/post/deletePost?postId=1`                | Deletes a post                           | Access |

### Collections

| Method   | Route                                      | Description                              | Auth   |
| -------- | ------------------------------------------ | ---------------------------------------- | ------ |
| `POST`   | `/api/collections/createCollection`        | Creates a collection                     | Access |
| `GET`    | `/api/collections/allCollections`          | Lists the authenticated user's collections | Access |
| `GET`    | `/api/collections/collectionId?id=1`       | Gets one collection with its posts       | Access |
| `PUT`    | `/api/collections/updateCollection`        | Updates a collection name                | Access |
| `DELETE` | `/api/collections/deteleCollection?id=1`   | Deletes a collection                     | Access |

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
