# Middleware Layer — `src/middlewares/`

In Express, a **middleware** is a function with the signature `(req, res, next)`. It runs during the request lifecycle before the route handler or after it (for error handlers).

Middleware is used for: security, logging, parsing, CORS, auth, and error handling.

---

## Middleware pipeline order (from `src/index.js`)

```
Request
  │
  ▼
helmet()              — sets security HTTP response headers
cookieParser()        — parses Cookie header into req.cookies
express.json()        — parses JSON request body into req.body
express.urlencoded()  — parses form-encoded body into req.body
corsMiddleware        — validates Origin header against allowlist
reqLogger             — logs method + URL + status + duration
  │
  ▼
Route handler (auth.route.js → auth.controller.js)
  │
  ▼
errorHandler          — catches any thrown error, sends JSON response
```

---

## `src/middlewares/cors.middleware.js`

**Purpose:** Allow cross-origin requests from trusted frontend origins.

**What it does:**

- Reads `ALLOWED_ORIGINS` from config (comma-separated string)
- Splits into array and passes to `cors()` as the `origin` option
- Enables `credentials: true` so cookies are sent with cross-origin requests
- Allows methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Allows headers: `Origin`, `X-Requested-With`, `Content-Type`, `Accept`, `Authorization`

**Example config:**

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
```

**Status:** Fully implemented and used in app bootstrap.

---

## `src/middlewares/req.middleware.js`

**Purpose:** Log every HTTP request with method, path, status code, and response time.

**How it works:**

1. On request arrival: logs `[METHOD] /path` at `debug` level
2. Captures `Date.now()` as start time
3. Listens for the `finish` event on `res`
4. On finish: logs `[METHOD] /path - STATUS - Xms` at `info` level

**Example log output:**

```
[POST] /api/v1/auth/login - 200 - 45ms
[POST] /api/v1/auth/send-otp - 409 - 12ms
```

**Status:** Fully implemented and used in app bootstrap.

---

## `src/middlewares/error.middleware.js`

**Purpose:** Global error handler — converts thrown errors into structured JSON responses.

**How it works:**

- Express identifies an error middleware by its 4-argument signature `(err, req, res, next)`
- Must be registered **last**, after all routes

**Two cases it handles:**

| Case          | Condition                 | Response                                                                              |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| Known error   | `err instanceof AppError` | `err.statusCode` + `{ success: false, error: err.code, message: err.message }`        |
| Unknown error | Any other `Error`         | `500` + `{ success: false, error: "SERVER_ERROR", message: "Internal Server Error" }` |

**Response shape example:**

```json
{
  "success": false,
  "error": "OTP_INVALID",
  "message": "Invalid or expired OTP"
}
```

Unknown errors are also logged with `logger.error` so they appear in server logs for debugging.

**Status:** Fully implemented and used in app bootstrap.

---

## `src/middlewares/auth.middleware.js`

**Purpose (intended):** Protect private routes by validating the JWT access token from the request cookie or `Authorization` header. Attach the decoded user identity to `req.user`.

**Current state:** ⚠️ **Placeholder only.**

```js
const authMiddleware = (req, res, next) => {
  // TODO: Add JWT/session validation and user context assignment.
  next();
};
```

It calls `next()` immediately without checking anything. This means it is **not protecting any routes** right now.

**What needs to be implemented here:**

1. Read `accessToken` from `req.cookies.accessToken` or `Authorization: Bearer <token>` header
2. Call `verifyAccessToken(token)` from `src/utils/auth.js`
3. Attach decoded payload to `req.user`
4. If token is missing or invalid, throw `UnauthorizedError`
5. Call `next()` only on success

**What the token payload looks like after decoding:**

```json
{
  "id": "uuid-of-user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Status:** ⚠️ Placeholder. No routes are currently protected by this middleware.
