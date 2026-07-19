# User Service — Documentation Index

This is the `user-service` microservice of the IRCTC backend.

It handles user **registration**, **login**, and **token session management**.

---

## What this service does

- Registers new users via a two-step OTP email verification flow
- Authenticates users with bcrypt password check + JWT token issuance
- Manages multi-device sessions using device-bound refresh tokens
- Rotates access/refresh tokens on every refresh call
- Detects and blocks refresh token reuse attacks

## Technology stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Runtime          | Node.js + Express              |
| Database         | PostgreSQL via Prisma ORM      |
| Cache / Sessions | Redis (ioredis)                |
| Passwords        | bcrypt (12 rounds)             |
| Auth tokens      | JSON Web Tokens (jsonwebtoken) |
| OTP hashing      | HMAC-SHA256 (Node.js `crypto`) |
| Logging          | Winston                        |
| Security headers | Helmet                         |
| Cookies          | httpOnly + secure + sameSite   |

---

## API routes at a glance

All routes are prefixed with `/api/v1/auth`.

| Method | Path          | Purpose                                          | Success Code |
| ------ | ------------- | ------------------------------------------------ | ------------ |
| `POST` | `/send-otp`   | Start registration — generate OTP                | `200`        |
| `POST` | `/verify-otp` | Complete registration — verify OTP + create user | `201`        |
| `POST` | `/login`      | Authenticate user, issue tokens                  | `200`        |
| `GET`  | `/refresh`    | Rotate access + refresh tokens                   | `200`        |
| `GET`  | `/health`     | Service health probe                             | `200`        |

---

## High-level request flow

```mermaid
flowchart TD
    Client -->|HTTP request| A[index.js - Express app]
    A --> B[helmet - security headers]
    B --> C[cookieParser]
    C --> D[json + urlencoded body parsing]
    D --> E[corsMiddleware]
    E --> F[reqLogger - log method+url+status+ms]
    F --> G[auth.route.js]
    G --> H[auth.controller.js]
    H --> I[auth.service.js]
    I --> J[(PostgreSQL via Prisma)]
    I --> K[(Redis)]
    H -->|error thrown| L[error.middleware.js]
    L -->|structured JSON| Client
```

---

## Documentation map

| File                              | What it covers                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docs/README.md`                  | This index                                                                                      |
| `docs/status/README.md`           | What is built, what is pending, HTTP status code reference                                      |
| `docs/config/README.md`           | Config, logger, Prisma, Redis setup                                                             |
| `docs/middlewares/README.md`      | All middleware files explained                                                                  |
| `docs/utils/README.md`            | All utility helpers explained                                                                   |
| `docs/setup/README.md`            | Local setup guide (PostgreSQL, Redis, Prisma, run)                                              |
| `docs/setup/send-verify-otp.md`   | Deep dive: registration OTP flow                                                                |
| `docs/setup/login-and-refresh.md` | Deep dive: login + token rotation flow                                                          |
| `docs/concepts/authentication.md` | **Concepts guide**: Auth vs Authz, Sessions, JWT, OAuth 2.0, Google Sign-In — beginner friendly |

---

## Registration flow (two-step OTP)

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as Controller
    participant Svc as Service
    participant OTP as otp.js
    participant Redis
    participant DB as PostgreSQL

    C->>Ctrl: POST /send-otp {firstName, lastName, email, password, confirmPassword}
    Ctrl->>Ctrl: validate fields + password match
    Ctrl->>Svc: sendOTP(firstName, lastName, email, password)
    Svc->>DB: findUnique(email) — check duplicate
    Svc->>Svc: bcrypt.hash(password, 12)
    Svc->>OTP: generateAndStoreOtp(meta)
    OTP->>Redis: GET otp_rate:<email>
    OTP->>Redis: SET otp:session:<uuid> {hashedOtp, meta} EX 300
    OTP->>Redis: INCR otp_rate:<email>, EXPIRE 3600
    OTP-->>Svc: {otp, otpSessionId}
    Svc-->>Ctrl: {otpSessionId, devOtp}
    Ctrl->>C: 200 {otpSessionId, otp} + Set-Cookie: otp_session

    C->>Ctrl: POST /verify-otp {otp, otpSessionId}
    Ctrl->>Svc: verifyOTP({otp, otpSessionId})
    Svc->>OTP: verifyOtp(otp, otpSessionId)
    OTP->>Redis: GET otp:session:<otpSessionId>
    OTP->>Redis: GET otp:attempts:<email>
    OTP->>OTP: HMAC-SHA256(email:otp) + timingSafeEqual
    OTP->>Redis: DEL session + attempts + rate keys
    OTP-->>Svc: meta {firstName, lastName, email, hashedPassword}
    Svc->>DB: user.create({...meta, emailVerified: true})
    Svc-->>Ctrl: user
    Ctrl->>C: 201 {user} + Clear-Cookie: otp_session
```

---

## Login and token rotation flow

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as Controller
    participant Svc as Service
    participant Redis
    participant DB as PostgreSQL

    C->>Ctrl: POST /login {email, password}
    Ctrl->>Ctrl: validate fields
    Ctrl->>Ctrl: getDeviceFingerprint(req) → deviceId
    Ctrl->>Svc: login(email, password, deviceId)
    Svc->>DB: findUnique(email)
    Svc->>Svc: bcrypt.compare(password, hash)
    Svc->>Svc: generateAccessToken(userId) → JWT 15m
    Svc->>Svc: generateRefreshToken(userId + jti) → JWT 7d
    Svc->>Redis: SET refresh:<userId>:<deviceId> = jti EX 604800
    Svc->>Redis: SET user:<userId> = safeUser EX 86400
    Svc-->>Ctrl: {accessToken, refreshToken, loggedInUser}
    Ctrl->>C: 200 {loggedInUser} + Set-Cookie: accessToken, refreshToken

    C->>Ctrl: GET /refresh (cookie: refreshToken)
    Ctrl->>Ctrl: getDeviceFingerprint(req) → deviceId
    Ctrl->>Svc: rotateRefreshToken(refreshToken, deviceId)
    Svc->>Svc: verifyRefreshToken(token) → {userId, jti}
    Svc->>Redis: GET refresh:<userId>:<deviceId> → storedJti
    Svc->>Svc: storedJti === jti ? (reuse attack check)
    Svc->>Svc: generateAccessToken + generateRefreshToken
    Svc->>Redis: SET refresh:<userId>:<deviceId> = newJti EX 604800
    Svc-->>Ctrl: {newAccessToken, newRefreshToken}
    Ctrl->>C: 200 + Set-Cookie: accessToken, refreshToken (rotated)
```

---

## Error response shape

All errors return a consistent JSON shape:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

See `docs/status/README.md` for the full status code and error code table.
