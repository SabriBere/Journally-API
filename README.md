# 🪐 Journally API

API REST del proyecto **Journally App**, creada para gestionar usuarios, colecciones y entradas de un diario personal.

Está desarrollada con **Node.js**, **Express**, **TypeScript**, **Prisma** y **PostgreSQL**, con autenticación JWT, validaciones por middleware y documentación interactiva con Swagger/OpenAPI.

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Documentación Swagger](#documentación-swagger)
- [Endpoints principales](#endpoints-principales)
- [Arquitectura](#arquitectura)
- [Base de datos](#base-de-datos)
- [Testing](#testing)
- [DER](#der)

## Funcionalidades

- Registro e inicio de sesión de usuarios.
- Autenticación mediante JWT usando headers `x-access-token` y `x-refresh-token`.
- CRUD de posts/entradas.
- CRUD de colecciones.
- Posts con `description` en formato JSON.
- Listados paginados con búsqueda y ordenamiento.
- Validación de requests con `express-validator`.
- Documentación interactiva con Swagger UI.
- Acceso a datos mediante Prisma ORM.

## Stack

- Node.js >= 20.6.0
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Swagger/OpenAPI
- Jest + Supertest como base para testing

## Requisitos

- Node.js `>=20.6.0`
- npm
- PostgreSQL local o remoto
- Variables de entorno configuradas

## Instalación

```bash
git clone https://github.com/<tu-usuario>/Journally-API.git
cd Journally-API
npm install
```

Creá un archivo `.env.dev` para desarrollo local con las variables necesarias.

## Variables de entorno

Ejemplo de configuración:

```env
NODE_ENV=development
PORT=8080
SOCKET_PORT=8001
SERVER=localhost

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

SALT_ROUND=10
```

Notas:

- `SERVER` y `PORT` se usan para armar la URL local de Swagger.
- `SOCKET_PORT` define el puerto del servidor WebSocket.
- `DATABASE_URL` debe apuntar a una base PostgreSQL.
- Los secretos JWT deben reemplazarse por valores seguros fuera de desarrollo.

## Scripts disponibles

```bash
npm run dev
```

Levanta el servidor en modo desarrollo usando `.env.dev`. Antes ejecuta `npm run db:local:up`.

```bash
npm run db:local:up
```

Levanta PostgreSQL local usando el script `scripts/local-postgres-up.sh`.

```bash
npm run db:local:down
```

Baja el PostgreSQL local usando `scripts/local-postgres-down.sh`.

```bash
npm run db:migrate:dev
```

Ejecuta las migraciones Prisma sobre el entorno `.env.dev`.

```bash
npm run user:create:dev
```

Crea un usuario de desarrollo usando `scripts/create-dev-user.ts`.

```bash
npm run generate
```

Genera el cliente Prisma.

```bash
npm run migrate
```

Crea una migración Prisma de desarrollo con nombre `init`.

```bash
npm run build
```

Compila TypeScript.

```bash
npm test
```

Actualmente es un placeholder y falla de forma intencional.

## Documentación Swagger

La documentación está disponible cuando el servidor está levantado:

```txt
http://localhost:8080/swagger
```

Si usás otro `PORT`, cambiá la URL según tu `.env.dev`.

La configuración vive en:

- `api/swagger/swagger.ts`
- `api/swagger/swaggerEntries.ts`

Swagger documenta schemas reutilizables, headers de autenticación, query params, request bodies y respuestas principales.

Al ejecutar `POST /api/users/login` desde Swagger UI, el token devuelto en el header `x-access-token` queda autorizado automáticamente para probar el resto de endpoints protegidos. La autorización se conserva en el navegador mientras dure la sesión de Swagger.

## Endpoints principales

Todas las rutas están montadas bajo `/api`.

### Users

| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/users/register` | Registra un usuario | No |
| `POST` | `/api/users/login` | Inicia sesión y devuelve `x-access-token` | No |
| `POST` | `/api/users/refresh` | Renueva tokens usando `x-refresh-token` | Refresh |
| `PUT` | `/api/users/update` | Actualiza contraseña | Access |
| `DELETE` | `/api/users/delete/:id` | Elimina el usuario autenticado | Access |

### Posts

| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/post/create?collectionId=1` | Crea un post dentro de una colección | Access |
| `POST` | `/api/post/createOne` | Crea un post sin colección | Access |
| `PUT` | `/api/post/updateOne?postId=1&collectionId=1` | Asigna un post a una colección | Access |
| `PUT` | `/api/post/updatePost?postId=1` | Edita título o descripción | Access |
| `GET` | `/api/post/findOne?postId=1` | Busca un post por id | No |
| `GET` | `/api/post` | Lista posts del usuario autenticado | Access |
| `DELETE` | `/api/post/deletePost?postId=1` | Elimina un post | Access |

### Collections

| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/collections/createCollection` | Crea una colección | Access |
| `GET` | `/api/collections/allCollections` | Lista colecciones del usuario | Access |
| `GET` | `/api/collections/collectionId?id=1` | Obtiene una colección con sus posts | Access |
| `PUT` | `/api/collections/updateCollection` | Actualiza el título de una colección | Access |
| `DELETE` | `/api/collections/deteleCollection?id=1` | Elimina una colección | Access |

## Arquitectura

```txt
api/
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
├── swagger
│   ├── swagger.ts
│   └── swaggerEntries.ts
├── utils
│   └── auth.ts
└── index.ts
```

El proyecto usa una arquitectura por capas:

```txt
HTTP -> Controller -> Service -> Prisma -> Database
```

### Controllers

Reciben la request de Express, leen `req.body`, `req.query` o `req.params`, revisan errores de validación y delegan la lógica a los services.

### Services

Concentran la lógica de negocio: verifican existencia de usuarios, posts o colecciones, preparan datos, ejecutan operaciones Prisma y normalizan respuestas internas.

### Prisma / DB

`api/db/db.ts` expone el cliente Prisma. Las consultas a base de datos se realizan desde los services.

### Middlewares

Incluyen autenticación JWT, refresh token, validaciones de usuarios/posts y manejo de rutas no encontradas.

### Swagger

Centraliza la documentación OpenAPI de la API. La UI permite explorar y probar endpoints desde el navegador.

## Base de datos

El schema Prisma define:

- `User`
- `Setting`
- `Collection`
- `Post`

`Post.description` es un campo `Json`. Se cambió a este tipo para guardar el contenido en el formato JSON que genera Tiptap, preservando la estructura del editor, como párrafos, nodos, marks y contenido enriquecido.

Las migraciones se encuentran en:

```txt
prisma/migrations
```

## Testing

El proyecto ya incluye dependencias para Jest y Supertest, pero el script `test` todavía no ejecuta una suite real.

Pendientes sugeridos:

- Tests unitarios de services.
- Tests de integración para rutas principales.
- Tests de autenticación y validaciones.

## DER

Nota: el DER original puede mostrar `Post.description` como texto. En la implementación actual ese campo fue migrado a `Json` para soportar el formato de contenido de Tiptap.

![DER](./captions/JournallyAPP%20-%20ERD.drawio.png)
