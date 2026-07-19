# Config Layer — `src/config/`

This section explains every file inside `src/config/`.

---

## `src/config/index.js`

**Purpose:** Single source of truth for all environment configuration.

Loads `.env` via `dotenv` and exports one `config` object.

### All config fields

| Field                     | Env var                   | Default                             | What it controls                                              |
| ------------------------- | ------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `SERVICE_NAME`            | —                         | `package.json` name                 | Used in logs                                                  |
| `PORT`                    | `PORT`                    | `4001`                              | Express listen port                                           |
| `NODE_ENV`                | `NODE_ENV`                | `development`                       | Controls dev-only behaviours (e.g. returning OTP in response) |
| `LOG_LEVEL`               | `LOG_LEVEL`               | `info`                              | Winston log verbosity                                         |
| `DATABASE_URL`            | `DATABASE_URL`            | `""`                                | PostgreSQL connection string for Prisma                       |
| `REDIS_URL`               | `REDIS_URL`               | `redis://:irctcpass@localhost:6379` | Redis connection string                                       |
| `ALLOWED_ORIGINS`         | `ALLOWED_ORIGINS`         | `http://localhost:4000`             | Comma-separated CORS allowed origins                          |
| `OTP_TTL`                 | `OTP_TTL`                 | `300`                               | Seconds before an OTP session expires in Redis                |
| `OTP_RATE_MAX_PER_HOUR`   | `OTP_RATE_MAX_PER_HOUR`   | `5`                                 | Max OTPs an email can request per hour                        |
| `OTP_MAX_VERIFY_ATTEMPTS` | `OTP_MAX_VERIFY_ATTEMPTS` | `5`                                 | Max wrong OTP attempts before lockout                         |
| `OTP_HMAC_SECRET`         | `OTP_HMAC_SECRET`         | hardcoded fallback                  | Secret used to HMAC-hash OTPs                                 |
| `MAIL_HOST`               | `MAIL_HOST`               | —                                   | SMTP host (not used in dev flow)                              |
| `MAIL_PORT`               | `MAIL_PORT`               | —                                   | SMTP port                                                     |
| `MAIL_SECURE`             | `MAIL_SECURE`             | —                                   | TLS flag                                                      |
| `MAIL_USER`               | `MAIL_USER`               | —                                   | SMTP username                                                 |
| `MAIL_PASS`               | `MAIL_PASS`               | —                                   | SMTP password                                                 |
| `MAIL_FROM`               | `MAIL_FROM`               | —                                   | From address for emails                                       |
| `JWT_ACCESS_SECRET`       | `JWT_ACCESS_SECRET`       | hardcoded fallback                  | Signing secret for access tokens                              |
| `JWT_REFRESH_SECRET`      | `JWT_REFRESH_SECRET`      | hardcoded fallback                  | Signing secret for refresh tokens                             |
| `ACCESS_TOKEN_EXP`        | `ACCESS_TOKEN_EXP`        | `"15m"`                             | Access token lifetime (JWT `expiresIn` string)                |
| `REFRESH_TOKEN_EXP`       | `REFRESH_TOKEN_EXP`       | `"7d"`                              | Refresh token lifetime (JWT `expiresIn` string)               |
| `ACCESS_TOKEN_EXP_SEC`    | `ACCESS_TOKEN_EXP_SEC`    | `900`                               | Access token lifetime in seconds (for cookie `maxAge`)        |
| `REFRESH_TOKEN_EXP_SEC`   | `REFRESH_TOKEN_EXP_SEC`   | `604800`                            | Refresh token lifetime in seconds (for cookie + Redis TTL)    |
| `REDIS_USER_TTL`          | `REDIS_USER_TTL`          | `86400`                             | Seconds to cache user object in Redis                         |

> **Important:** The hardcoded fallback secrets exist only for local development. Always set real secrets in `.env` for production.

---

## `src/config/logger.js`

**Purpose:** Creates a shared Winston logger used across all files.

- Log level is read from `config.LOG_LEVEL`
- Every log line includes: `timestamp`, `level`, `service name`, and `message`
- Transport: console (stdout)

Usage in any file:

```js
const logger = require('../config/logger');
logger.info('Something happened');
logger.error('Something broke');
logger.debug('Deep detail');
```

---

## `src/config/redis.js`

**Purpose:** Redis client singleton using `ioredis`.

### Why singleton?

Opening multiple Redis connections wastes resources. With the singleton pattern, `getRedisClient()` always returns the same instance. The connection is created once on first call.

### What is implemented

- `getRedisClient()` — returns the singleton instance, creating it if needed
- Event listeners: `connect`, `ready`, `error`, `close`, `reconnecting`, `end`
- All reconnect and error events are logged
- `closeConnection()` — graceful shutdown
- `isReady()` — returns boolean connection state
- `testConnection()` — sends PING to verify Redis is reachable

### Redis keys used by auth feature

| Key pattern                   | Purpose                                       | TTL                 |
| ----------------------------- | --------------------------------------------- | ------------------- |
| `otp:session:<uuid>`          | OTP session: stores `{hashedOtp, meta}`       | 300s (configurable) |
| `otp_rate:<email>`            | OTP send count per hour                       | 3600s               |
| `otp:attempts:<email>`        | Wrong OTP attempt count                       | 300s                |
| `refresh:<userId>:<deviceId>` | Active JTI for this user+device session       | 604800s (7d)        |
| `user:<userId>`               | Cached user profile object (without password) | 86400s (24h)        |

---

## `src/config/prisma.js`

**Purpose:** Creates and exports a Prisma ORM client for PostgreSQL.

### Safe initialisation behavior

- If `DATABASE_URL` is missing or empty: Prisma is disabled, `null` is exported, and a warning is logged. The service will still start.
- If `DATABASE_URL` is set: Prisma client is created and cached in `global.__prisma` to prevent repeated client creation during hot-reload in development.

### User model (from `prisma/schema.prisma`)

```prisma
model User {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  email         String   @unique
  password      String?
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

- `password` is stored as a bcrypt hash (never plain text)
- `emailVerified` is set to `true` automatically when user is created via OTP verification
- `id` is a UUID (not an auto-increment integer)
