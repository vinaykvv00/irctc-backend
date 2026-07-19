# User Service

Node.js + Express user-service for IRCTC backend.

## What is implemented right now

- Express app bootstrap with security middlewares
- Health routes (`GET /` and `GET /health`)
- Central config management using `.env`
- Structured Winston logging
- Redis client wrapper (singleton pattern)
- Prisma client bootstrap for PostgreSQL
- Global error handling + custom error classes

## Project structure

```txt
src/
  index.js
  config/
    index.js
    logger.js
    prisma.js
    redis.js
  middlewares/
    auth.middleware.js
    cors.middleware.js
    error.middleware.js
    req.middleware.js
  controllers/
  service/
  utils/
    asyncHandler.js
    error.js
```

## Prerequisites

- Node.js 20+ (works on Node 24 too)
- npm
- PostgreSQL (for Prisma DB connection)
- Redis (for cache/session use)

## Environment variables

Create/update `.env` in project root:

```env
PORT=4001
NODE_ENV=development
LOG_LEVEL=info

DATABASE_URL=postgresql://user:password@localhost:5432/user_service_database
REDIS_URL=redis://:irctcpass@localhost:6379
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:4001
```

Important:

- If you run Redis using Docker Compose service name, `REDIS_URL` can be `redis://:irctcpass@redis:6379`.
- If you run locally on your machine, prefer `redis://:irctcpass@localhost:6379`.

## Install and run

```bash
npm install
npm run dev
```

Or production-style start:

```bash
npm start
```

Service URLs:

- http://localhost:4001/
- http://localhost:4001/health

## Prisma commands

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:studio
```

Note:

- Prisma client in `src/config/prisma.js` is disabled automatically if `DATABASE_URL` is missing.

## Redis usage

Redis wrapper is in `src/config/redis.js`.

Exports:

- `getRedisClient()` -> lazy creates/returns Redis client
- `RedisClient` -> helper class with `isReady()`, `testConnection()`, `closeConnection()`

## Detailed docs

- `docs/README.md`
- `docs/config/README.md`
- `docs/middlewares/README.md`
- `docs/utils/README.md`
- `docs/status/README.md`
- `docs/setup/README.md`
