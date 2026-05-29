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
- npm
- PostgreSQL, either local or hosted
- Environment variables configured

## Installation

```bash
git clone https://github.com/<your-username>/Journally-API.git
cd Journally-API
npm install
```

Create a `.env.dev` file for local development.

## Environment Variables

Local development example:

```env
NODE_ENV=development
PORT=8080
SERVER=localhost

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

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

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

JWT_SECRET=replace_with_a_secure_secret
JWT_REFRESH_SECRET=replace_with_a_secure_refresh_secret

SALT_ROUND=10
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

Notes:

- `DATABASE_URL` must point to a PostgreSQL database.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be strong production secrets.
- `ALLOWED_ORIGINS` is a comma-separated list of allowed frontend origins.
- `SERVER` and `PORT` are used by the Swagger server configuration.
- The WebSocket server runs on the same HTTP server and port as the REST API. There is no separate socket port in the current implementation.

## Available Scripts

```bash
npm run dev
```

Starts the development server using `.env.dev`. The `predev` script starts the local PostgreSQL helper first.

```bash
npm run db:local:up
```

Starts the local PostgreSQL environment through `scripts/local-postgres-up.sh`.

```bash
npm run db:local:down
```

Stops the local PostgreSQL environment through `scripts/local-postgres-down.sh`.

```bash
npm run db:migrate:dev
```

Runs Prisma migrations against the `.env.dev` database.

```bash
npm run db:migrate:deploy
```

Runs Prisma migrations in deployment environments.

```bash
npm run user:create:dev
```

Creates a development user through `scripts/create-dev-user.ts`.

```bash
npm run generate
```

Generates the Prisma client.

```bash
npm run migrate
```

Creates a new Prisma development migration.

```bash
npm run build
```

Compiles TypeScript into `dist`.

```bash
npm start
```

Starts the compiled API from `dist/src/index.js`.

```bash
npm test
```

Runs the Jest test suite.

## Database

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
npm run db:migrate:dev
```

Apply migrations in production with:

```bash
npm run db:migrate:deploy
```

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

This API can be deployed with a hosted PostgreSQL database such as Supabase and a Node.js hosting provider such as Render or Fly.io.

### Supabase

Supabase can be used as the hosted PostgreSQL database.

Recommended setup:

- Create a Supabase project.
- Create a dedicated database user for Prisma.
- Use the Supabase Postgres connection string as `DATABASE_URL`.
- Run Prisma migrations with `npm run db:migrate:deploy`.

For a standard server deployment, use the Supavisor session pooler connection string when appropriate. For serverless or highly autoscaled environments, review Supabase's Prisma guidance for the transaction pooler connection string.

### Render

Suggested Render Web Service settings:

```txt
Build Command: npm ci && npm run generate && npm run build
Pre-Deploy Command: npm run db:migrate:deploy
Start Command: npm start
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

The original ERD may show `Post.description` as text. In the current implementation, that field is `Json` to support Tiptap editor content.

![ERD](./captions/JournallyAPP%20-%20ERD.drawio.png)
