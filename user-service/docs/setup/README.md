# Setup Guide (Beginner Friendly)

This guide helps you set up PostgreSQL, Redis, Prisma, and run the user-service.

## 1. Install dependencies

From project root:

```bash
npm install
```

## 2. Configure `.env`

Use this template:

```env
PORT=4001
NODE_ENV=development
LOG_LEVEL=info

DATABASE_URL=postgresql://user:password@localhost:5432/user_service_database
REDIS_URL=redis://:irctcpass@localhost:6379
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:4001
```

## 3. Start PostgreSQL

Option A: Local PostgreSQL service

- Create database: `user_service_database`
- Create DB user and password that match `DATABASE_URL`

Option B: Docker example

```bash
docker run --name user-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=user_service_database -p 5432:5432 -d postgres:16
```

## 4. Start Redis

Option A: Local Redis installation

- Start Redis server on `6379`
- Configure password `irctcpass` if your URL includes it

Option B: Docker example

```bash
docker run --name user-redis -p 6379:6379 -d redis:7 redis-server --requirepass irctcpass
```

## 5. Prisma setup

Run:

```bash
npm run prisma:generate
```

If you add Prisma schema/migrations later, run:

```bash
npm run prisma:migrate:dev
```

Open Prisma Studio (optional):

```bash
npm run prisma:studio
```

## 6. Run service

Development mode:

```bash
npm run dev
```

Normal start:

```bash
npm start
```

Check in browser or Postman:

- `GET http://localhost:4001/`
- `GET http://localhost:4001/health`

Expected health response:

```json
{"status": "UP"}
```

## 7. Troubleshooting

### Error: Cannot find module

- Run `npm install`
- Confirm dependencies exist in `package.json`

### Prisma is disabled warning

- Set valid `DATABASE_URL` in `.env`

### Redis connection errors

- Verify Redis is running on host/port in `REDIS_URL`
- Verify password in URL matches Redis server password

### Port already in use

- Change `PORT` in `.env` to another value (for example `4002`)

## OTP flow docs

If you want to understand the current local development OTP implementation in detail, read:

- `docs/setup/send-verify-otp.md`

That document explains:

- the request flow
- the Redis keys used
- how `send-otp` and `verify-otp` connect
- why the OTP is returned in development mode
