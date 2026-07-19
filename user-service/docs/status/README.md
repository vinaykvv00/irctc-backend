# Current Project Status

Last updated: June 27, 2026

This file tells you exactly what is implemented, what is partially done, and what is still missing.

---

## What is fully built and working

### Infrastructure

- Express app bootstrap (`src/index.js`) with proper startup error handling
- Helmet security headers
- Cookie parser
- JSON and URL-encoded body parsing
- CORS middleware (origin allowlist from config)
- Request/response logger with timing
- Global error handler (structured JSON for all errors)
- Health check: `GET /health` → `{ "status": "UP" }`
- Root probe: `GET /` → plaintext running message
- Central `config` object (env vars with safe defaults)
- Winston structured logger
- Redis singleton (`src/config/redis.js`) with reconnect/event handling
- Prisma client with global cache (`src/config/prisma.js`)
- Prisma `User` model with migrations applied

### Auth Feature — Registration via OTP

| Step | Route                          | Status Code | Description                                                                            |
| ---- | ------------------------------ | ----------- | -------------------------------------------------------------------------------------- |
| 1    | `POST /api/v1/auth/send-otp`   | `200`       | Validates fields, hashes password, stores OTP session in Redis, returns `otpSessionId` |
| 2    | `POST /api/v1/auth/verify-otp` | `201`       | Verifies OTP against Redis hash, creates user in PostgreSQL, clears cookie             |

### Auth Feature — Login and Session Management

| Step | Route                      | Status Code | Description                                                                                              |
| ---- | -------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| 3    | `POST /api/v1/auth/login`  | `200`       | Validates credentials, issues `accessToken` + `refreshToken` as `httpOnly` cookies, caches user in Redis |
| 4    | `GET /api/v1/auth/refresh` | `200`       | Rotates refresh token using device-bound JTI validation, reissues both tokens                            |

### Security Mechanisms

- Passwords hashed with `bcrypt` (12 rounds)
- OTPs hashed with HMAC-SHA256 (never stored in plain text)
- OTP rate limiting: max 5 OTP sends per email per hour (`otp_rate:<email>`)
- OTP attempt limiting: max 5 wrong attempts per session (`otp:attempts:<email>`)
- Timing-safe OTP comparison (`crypto.timingSafeEqual`)
- JWT access tokens (15 min expiry) signed with separate secret
- JWT refresh tokens (7 days expiry) with unique `jti` per issue
- Refresh tokens are device-bound via fingerprint hash
- Refresh token rotation: old JTI is invalidated on every rotation
- Refresh token reuse attack detection: if JTI mismatch is detected, entire device session is deleted
- User profile cached in Redis (TTL 24h) to avoid DB lookups
- `httpOnly` + `secure` + `sameSite` cookie flags on all auth cookies

### Utilities

- `asyncHandler.js` — wraps async controllers, passes errors to `next(error)` automatically
- `error.js` — full custom error class hierarchy with HTTP status codes and machine-readable error codes
- `otp.js` — full OTP lifecycle (generate, HMAC hash, Redis store, rate check, verify, cleanup)
- `auth.js` — JWT access/refresh token generation and verification
- `deviceFingerprint.js` — SHA-256 fingerprint of `User-Agent + IP + Accept` header (16 hex chars)

---

## What is partially built

| Item            | Location                             | Current State                                                           |
| --------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Auth middleware | `src/middlewares/auth.middleware.js` | Placeholder — just calls `next()`, no JWT verification yet              |
| Email sending   | `src/utils/email.js`                 | File exists but OTP is not emailed in dev; returned in response instead |
| Profile routes  | —                                    | No `GET /me`, `PATCH /profile`, or `DELETE /account` routes yet         |
| Logout route    | —                                    | No explicit logout/token invalidation route yet                         |

---

## What is not built yet

- `GET /api/v1/auth/me` — get current user profile
- `POST /api/v1/auth/logout` — invalidate session / delete Redis refresh key
- Password reset flow
- Role-based access control
- Request validation middleware (Joi/Zod)
- Integration / unit tests
- Rate limiting on login endpoint
- Admin or ticket-booking routes (different service)

---

## HTTP status codes reference

### Success codes

| Code          | Used when                                               |
| ------------- | ------------------------------------------------------- |
| `200 OK`      | Send-OTP success, Login success, Token rotation success |
| `201 Created` | Verify-OTP success → user created                       |

### Error codes

| Code  | Class                  | `error` field       | When thrown                                            |
| ----- | ---------------------- | ------------------- | ------------------------------------------------------ |
| `400` | `BadRequestError`      | `BAD_REQUEST`       | Missing fields, password mismatch, invalid/expired OTP |
| `400` | `BadRequestError`      | `OTP_INVALID`       | OTP does not match the stored hash                     |
| `401` | `UnauthorizedError`    | `UNAUTHORIZED`      | Missing refresh token cookie                           |
| `403` | `ForbiddenError`       | `FORBIDDEN`         | Expired session or refresh token reuse attack          |
| `409` | `ConflictError`        | `CONFLICT`          | Email already registered                               |
| `429` | `TooManyRequestsError` | `TOO_MANY_REQUESTS` | OTP send rate exceeded or max verify attempts exceeded |
| `500` | `InternalServerError`  | `SERVER_ERROR`      | Unhandled exceptions                                   |

---

## Architecture overview

```
src/
├── index.js              ← app entrypoint, middleware pipeline, server startup
├── config/
│   ├── index.js          ← central env config
│   ├── logger.js         ← Winston logger
│   ├── prisma.js         ← Prisma client singleton
│   └── redis.js          ← Redis client singleton
├── routes/
│   └── auth.route.js     ← 4 auth routes registered
├── controllers/
│   └── auth.controller.js ← HTTP layer: validate req, call service, set cookies, send res
├── service/
│   └── auth.service.js   ← business logic: user checks, bcrypt, token issuance, Redis ops
├── middlewares/
│   ├── cors.middleware.js ← CORS config
│   ├── req.middleware.js  ← request/response logger
│   ├── error.middleware.js ← global error handler
│   └── auth.middleware.js ← PLACEHOLDER (not protecting routes yet)
└── utils/
    ├── asyncHandler.js   ← async error propagation
    ├── error.js          ← custom error classes
    ├── otp.js            ← OTP lifecycle + Redis operations
    ├── auth.js           ← JWT token helpers
    ├── deviceFingerprint.js ← device ID derivation
    └── email.js          ← email helper (not used in dev flow)
```

## Recommended next steps

1. Implement real JWT validation in `auth.middleware.js`
2. Add `POST /api/v1/auth/logout` to delete `refresh:<userId>:<deviceId>` from Redis
3. Add `GET /api/v1/auth/me` protected by auth middleware
4. Send real OTP emails via `email.js` (configure SMTP in `.env`)
5. Add rate limiting on the login endpoint
6. Write integration tests for all 4 routes
