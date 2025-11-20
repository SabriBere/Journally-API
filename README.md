# 🪐 Jornally-API

API REST del proyecto **Journally APP**, creada para gestionar usuarios, colecciones y entradas del diario personal.
Implementada con una arquitectura limpia, separación por capas y validaciones robustas.

## 📚 Indice

- [Introducción](#introducción)
    - [Funcionalidades](#funcionalidades)
- [Clonar el repositorio](#clonar-el-repositorio)
- [Instalación](#instalación)
- [Stack del proyecto](#stack-del-proyecto)
- [Entornos e Integración](#entornos-e-integración)
    - [Scripts disponibles](#scripts-disponibles)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
    - [Clonar el repositorio](#clonar-el-repositorio)
- [Configuraciones de formato](#configuraciones-de-formato)
    - [Prettier](#prettier)
    - [ESLint](#eslint)
- [Testing](#testing)
- [DER](#der)

---

## 📝 Introducción:

**Journally-API** es el backend del ecosistema Journally.
Provee endpoints para manejar:

- Usuarios

- Colecciones

- Entradas

- Autenticación mediante JWT

- Validaciones y sanitización de datos

- Documentación con Swagger

La API está desarrollada con **Node.js**, **Express** y **Prisma**, conectada a una base de datos relacional.

### ✨ Funcionalidades

✔️ Registro e inicio de sesión de usuarios

✔️ Manejo completo de colecciones (CRUD)

✔️ Manejo de entradas o posts (CRUD)

✔️ Validación de datos con middlewares

✔️ Manejo de errores centralizado

✔️ Autenticación con JWT

✔️ Documentación con Swagger UI

---

## 📦 Clonar repositorio

```bash

git clone https://github.com/<tu-usuario>/Journally-API.git
cd Journally-API

```

---

## 🛠 Instalación

1. Instalar dependencias

```bash
`npm install` o `npm i`

```

2. Crear un archivo _*.env*_ con variables de entorno necesarias.
   Utilizar de referecia el archivo _*env.example*_

```bash
# Entorno de la aplicación
NODE_ENV=development
PORT=8080

# Cors - orígenes permitidos (separados por comas)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Configuración de Swagger
SERVER=localhost

# Vueltas en desarrollo para bcrypt
SALT_ROUND=10

# Conexión a la base de datos (reemplazar con datos reales)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

# Secretos para JWT (reemplazar con strings seguros)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

```

---

## Stack del proyecto

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT con bcrypt
- Swagger

---

## 🔧 Entornos e Integración

### Scripts disponibles

```json
"scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "dev": "node --env-file=.env.dev --watch --watch-preserve-output -r ts-node/register api/index.ts",
        "generate": "npx prisma generate",
        "migrate": "npx prisma migrate dev --name init",
        "build": "tsc"
    },

```

---

## 🧱 Arquitectura

```bash

api/
├── index.ts
│
├── config
│
├── controllers
│   ├── collectionsControllers.ts
│   ├── postControllers.ts
│   └── usersControllers.ts
│
├── db
│   └── db.ts
│
├── middlewares
│   ├── authtenticatedToken.ts
│   ├── notFound.ts
│   ├── postValidation.ts
│   └── userValidation.ts
│
├── routes
│   ├── colletions.ts
│   ├── post.ts
│   ├── routes.ts
│   └── users.ts
│
├── services
│   ├── collectionServices.ts
│   ├── postServices.ts
│   └── usersServices.ts
│
├── swagger
│   ├── swagger.ts
│   └── swaggerEntries.ts
│
└── utils
    └── auth.ts

```

### Patrón aplicado

El proyecto sigue una arquitectura por capas denómiado **_Service Layer_** o **_Servicio por capaz_**:

- **Controllers** → reciben la request, validan y llaman a Services.

- **Services** → contiene la lógica de negocio.

- **DB/Prisma** → acceso a la base de datos.

- **Middlewares** → validaciones, auth, manejo de errores.

- **Swagger** → documentación centralizada.

## 🧹 Configuraciones de fromato

### Prettier

Archivo _*.prettierrc*_ sugerido:

```json
{
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": false,
    "printWidth": 80,
    "tabWidth": 4,
    "overrides": [
        {
            "files": "*.yml",
            "options": {
                "tabWidth": 2
            }
        }
    ]
}
```

### Eslint

Este proyecto utiliza Eslint en su versión 9, dado que la versión 8 se encontrará deprecada.

```json
{
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
    ]
}
```

## 🧪 Testing

A definir. Se recomienda Jest + Supertest para testear controladores y endpoints.

## 🗂 DER - Diagrama entidad-relaciones

[DER](./captions/JournallyAPP%20-%20ERD.drawio.png)

### Creación de base de datos
