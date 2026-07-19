# Utils Layer — `src/utils/`

These are reusable helper modules. They contain no Express routing — only pure logic that can be called from services and controllers.

---

## `src/utils/error.js`

**Purpose:** A hierarchy of custom error classes that carry an HTTP status code and a machine-readable error code.

### Class hierarchy

```
Error (built-in)
  └── AppError (base)
        ├── BadRequestError       400  BAD_REQUEST
        ├── UnauthorizedError     401  UNAUTHORIZED
        ├── ForbiddenError        403  FORBIDDEN
        ├── NotFoundError         404  NOT_FOUND
        ├── ConflictError         409  CONFLICT
        ├── TooManyRequestsError  429  TOO_MANY_REQUESTS
        └── InternalServerError   500  SERVER_ERROR
```

### How it connects to the error middleware

When you throw any of these in a controller or service:

```js
throw new ConflictError('User already exists');
```

The async handler catches the rejected promise and passes it to `next(error)`. The error middleware then reads `err.statusCode` and `err.code` to build the response:

```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "User already exists"
}
```

### Custom error codes in use

Some errors use non-default `code` values for more specific client handling:

| Thrown in                       | Code          | Meaning                            |
| ------------------------------- | ------------- | ---------------------------------- |
| `auth.service.js` — OTP invalid | `OTP_INVALID` | The OTP value was wrong or expired |
| All others                      | Class default | See hierarchy table above          |

---

## `src/utils/asyncHandler.js`

**Purpose:** Wraps an async route handler so that any rejected Promise is automatically forwarded to Express's `next(error)`.

**Why it matters:**

Without this, you would need try/catch in every controller:

```js
// Without asyncHandler (verbose)
exports.login = async (req, res, next) => {
  try {
    // ...
  } catch (err) {
    next(err);
  }
};

// With asyncHandler (clean)
exports.login = asyncHandler(async (req, res) => {
  // If this throws, error middleware handles it automatically
});
```

**Status:** Fully implemented. All 4 controller functions use it.

---

## `src/utils/otp.js`

**Purpose:** The complete OTP lifecycle — generate, store, rate-limit, verify, and clean up.

### `generateAndStoreOtp(meta)`

Steps:

1. Check `otp_rate:<email>` in Redis — if count >= 5 throw `TooManyRequestsError` (`429`)
2. Generate a 6-digit numeric OTP using `otp-generator`
3. Create a UUID as `otpSessionId`
4. Compute `HMAC-SHA256(OTP_HMAC_SECRET, email + ":" + otp)` → `hashedOtp`
5. Store in Redis: `otp:session:<otpSessionId>` = `{hashedOtp, meta}` with TTL = `OTP_TTL` seconds
6. Increment `otp_rate:<email>`, set EXPIRE 3600s (1 hour)
7. Return `{otp, otpSessionId}`

### `verifyOtp(otp, otpSessionId)`

Steps:

1. Read `otp:session:<otpSessionId>` from Redis — if missing, return `null`
2. Parse `{hashedOtp, meta}`
3. Check `otp:attempts:<email>` — if count >= 5 throw `TooManyRequestsError`
4. Compute `HMAC-SHA256(secret, email + ":" + incoming_otp)` → `incomingHash`
5. Compare with `crypto.timingSafeEqual(incomingHash, storedHash)`
6. **If valid:** DELETE session key + attempts key + rate key. Return `meta`.
7. **If invalid:** INCREMENT attempts key + set EXPIRE. Return `null`.

### Security design notes

- The OTP itself is **never stored in Redis** — only its HMAC hash is stored
- `timingSafeEqual` prevents timing-based side-channel attacks
- Rate limiting prevents brute force (5 sends/hour, 5 guesses/session)
- Successful verification immediately destroys the session (single-use OTP)

### Redis keys

| Key                    | Value                    | TTL   |
| ---------------------- | ------------------------ | ----- |
| `otp:session:<uuid>`   | `{hashedOtp, meta}` JSON | 300s  |
| `otp_rate:<email>`     | integer count            | 3600s |
| `otp:attempts:<email>` | integer count            | 300s  |

---

## `src/utils/auth.js`

**Purpose:** JWT access and refresh token lifecycle helpers.

### Functions

#### `generateAccessToken(userId)`

- Creates a JWT with payload `{ id: userId }`
- Signed with `JWT_ACCESS_SECRET`
- Expires in `ACCESS_TOKEN_EXP` (default `"15m"`)

#### `generateRefreshToken(userId)`

- Creates a JWT with payload `{ id: userId, jti: crypto.randomUUID() }`
- The `jti` (JWT ID) is a unique UUID per token issuance — used to track which refresh token is valid for a device
- Signed with `JWT_REFRESH_SECRET`
- Expires in `REFRESH_TOKEN_EXP` (default `"7d"`)

#### `verifyAccessToken(token)`

- Calls `jwt.verify(token, JWT_ACCESS_SECRET)`
- Returns decoded payload or throws `JsonWebTokenError` / `TokenExpiredError`

#### `verifyRefreshToken(token)`

- Calls `jwt.verify(token, JWT_REFRESH_SECRET)`
- Returns decoded payload or throws if expired/invalid

#### `hashToken(token)`

- SHA-256 hash of a token string (available but not currently used in service logic)

### Why two separate secrets?

Using different secrets for access and refresh tokens means that if one secret leaks, the other token type is not compromised. They are independently rotatable.

### Token rotation and reuse detection (in `auth.service.js`)

```
Login:
  generateRefreshToken() → jti
  Redis.set(refresh:<userId>:<deviceId>, jti, EX 7d)

Refresh request:
  verifyRefreshToken(token) → {userId, jti}
  Redis.get(refresh:<userId>:<deviceId>) → storedJti

  if storedJti is null    → session expired → 403 FORBIDDEN
  if storedJti !== jti    → reuse attack detected → DELETE key → 403 FORBIDDEN
  if storedJti === jti    → valid → generate new tokens → update Redis with newJti
```

---

## `src/utils/deviceFingerprint.js`

**Purpose:** Derive a stable, short device identifier from the incoming HTTP request.

### How it works

```js
const raw = `${userAgent}|${ip}|${accept}`;
return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
```

Combines three signals:

| Signal                 | Header       |
| ---------------------- | ------------ |
| Browser/client name    | `User-Agent` |
| Client IP address      | `req.ip`     |
| Accepted content types | `Accept`     |

Produces a 16-character hex string (64-bit, enough to distinguish devices in practice).

### Why it is used

Refresh tokens are stored in Redis as `refresh:<userId>:<deviceId>`. This means:

- A user logged in on **phone** gets a different Redis key than the same user on **laptop**
- Each device has its own independent refresh token
- Logging out on one device does not affect other devices
- A stolen refresh token from device A cannot be used from device B (different fingerprint = different Redis key = not found = 403)

### Limitations

- If a user switches networks (IP changes) or updates their browser, the fingerprint changes and they will need to log in again
- This is a trade-off: stronger binding vs. occasional false logouts
