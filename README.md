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
    - [Creación de base de datos (PostgreSQL + Prisma)](#creación-de-base-de-datos)

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

```
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

### 📌 Patrón aplicado

El proyecto implementa una arquitectura por capas basada en el patrón **_Service Layer_** o **_Servicio por capaz_**, una estructura muy utilizada en APIs modernas porque separa las responsabilidades, facilita el mantenimiento y hace que el sistema sea altamente testeable.

El proyecto sigue una arquitectura por capas denómiado **_Service Layer_** o **_Servicio por capaz_**:

🧱 1. **Controllers (Capa HTTP)**

Los _controllers_ son la interfaz entre Express y la lógica real del sistema.

Responsabilidades:

- Recibir datos de req.query, req.params, req.body.
- Ejecutar validaciones básicas (express-validator).
- Invocar métodos de la capa de servicios.
- Formatear la respuesta HTTP (status code, JSON, mensajes).
- Nunca contienen lógica de negocio.

_*Objetivo:*_ Mantener el controlador enfocado solo en reglas HTTP, no en decisiones de negocio.

🧠 2. **Services (Capa de Lógica de Negocio)**

La capa **_Service Layer_** concentra la lógica central de la aplicación:

- Validaciones de reglas (usuario existe, colección válida, etc.).
- Orquestación de múltiples consultas a la DB.
- Control y unificación de errores internos.
- Transformación de datos y preparación de respuestas.

Se utiliza un estilo _POO relajado (clases como namespaces) combinado con estilo funcional_, lo que permite:

- agrupar métodos por dominio (PostServices, UserServices, etc.),
- pero mantener cada método sin estado interno y altamente testeable.

Esto permite testear cada service _sin Express_, simplemente llamándolo como una función.

🗄️ 3. **DB / Prisma (Capa de Acceso a Datos)**

Prisma actúa como el ORM para consultas a la base de datos.

- Las consultas se realizan exclusivamente desde la capa de Servicios.
- No contiene lógica de negocio.
- Permite tipado fuerte y autocompletado sobre el esquema.
- Centraliza la persistencia y mantiene limpieza en el resto del proyecto.

_*Objetivo:*_ Desacoplar totalmente la infraestructura de la lógica de negocio.

🧩 4. **Middlewares**

Los _middlewares_ permiten agregar lógica transversal sin contaminar los controllers:

- Autenticación (JWT / Session)
- Validaciones (express-validator)

Se ejecutan antes de alcanzar el controller, permitiendo garantizar que la request llega en un estado válido.

📚 5. **Swagger (Documentación)**

El proyecto incluye documentación con _Swagger/OpenAPI_, lo que proporciona:

- Descripción clara de rutas, métodos, parámetros y respuestas.
- Posibilidad de testear endpoints desde una UI amigable.

Este diseño se eligió porque proporciona:

✔️ Separación de responsabilidades (SRP)
Cada capa hace solo una cosa.

✔️ Testeo simple
La lógica del negocio se puede testear aislada de Express, copiando un estilo más cercano a FP puro.

✔️ Escalabilidad
Nuevas features se suman agregando servicios y controllers sin romper la estructura.

✔️ Reutilización
Los services pueden ser utilizados por otros ambientes (CLI, workers, CRONs) sin depender de Express.

✔️ Claridad en el flujo

```txt
HTTP → Controller → Service → Prisma → DB

                  ┌────────────┐
   Request  ─────►│ Controller │──────┐
                  └────────────┘      │
                                      ▼
                                ┌────────────┐
                                │  Service   │
                                │ (negocio)  │
                                └────────────┘
                                      │
                                      ▼
                                ┌────────────┐
                                │   Prisma   │
                                │   (ORM)    │
                                └────────────┘
                                      │
                                      ▼
                                  Database
```

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

![DER](./captions/JournallyAPP%20-%20ERD.drawio.png)

