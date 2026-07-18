# Hackathon Starter v2 — Summary

Location: `Backend/starter`. Package root: `com.hackathon.starter`.

This is a reusable Spring Boot backend base meant to eliminate the boilerplate (auth, RBAC,
caching, async email, rate limiting, exception handling, docs, logging) that otherwise gets
rebuilt from scratch at every hackathon. It's a rewrite of an older template (`secure-starter`)
that had a number of concrete flaws — hardcoded secrets, indiscriminate UUID usage, missing
indexes, a single long-lived JWT with no revocation, synchronous plaintext email, no rate
limiting, dead code — all of which are fixed here. Full decision-by-decision rationale lives in
the plan at `~/.claude/plans/i-need-to-build-ethereal-lemon.md`; this document is the "what/how"
companion to that "why".

---

## 1. Tech Stack

| Concern | Choice |
|---|---|
| Language / runtime | Java 21, Spring Boot **4.1.0** (Spring Framework 7.0.8) |
| Build | Maven |
| Database | MySQL (`com.mysql:mysql-connector-j`), schema via `ddl-auto=update` (no Flyway — see §5) |
| Auth | Manual (email/password) + Google OAuth2, both producing the same JWT pair |
| Tokens | `io.jsonwebtoken` (jjwt) 0.12.6 — stateless access + refresh JWTs |
| Password hashing | BCrypt (`spring-security-crypto`) |
| Caching | Caffeine, via Spring's `@Cacheable`/`@CacheEvict` abstraction |
| Async | Spring `@Async` + a dedicated `ThreadPoolTaskExecutor` (email only) |
| Email | `spring-boot-starter-mail` + `MimeMessageHelper` (HTML) + Thymeleaf templates |
| Rate limiting | Resilience4j (`resilience4j-spring-boot3:2.4.0`) `@RateLimiter` |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) |
| AOP | `spring-boot-starter-aspectj` (Boot 4's renamed `aop` starter) — service-layer logging aspect |
| API docs | springdoc-openapi 3.0.3 (OpenAPI 3 / Swagger UI) |
| Object mapping | ModelMapper 3.2.6, wrapped in a dedicated `UserMapper` |
| Future ML integration | Spring 6 `RestClient` + declarative `@HttpExchange` (not OpenFeign) |
| Logging | SLF4J/Logback (built into Boot) + a request-logging filter with correlation IDs |
| Scheduling | Spring `@Scheduled` (expired-token cleanup) |

### Notable Spring Boot 4 naming changes this project already accounts for
`spring-boot-starter-web` → `spring-boot-starter-webmvc`; `spring-boot-starter-oauth2-client` →
`spring-boot-starter-security-oauth2-client`; `spring-boot-starter-aop` →
`spring-boot-starter-aspectj`; and there's no single `spring-boot-starter-test` umbrella anymore —
every starter has its own matching `-test` artifact.

---

## 2. Feature Inventory

### Authentication
- Manual signup (email/password, BCrypt-hashed) with **mandatory email verification** before login is allowed.
- Login issues a **short-lived access JWT (45 min)** + a **longer-lived refresh JWT (30 days)**.
- Google OAuth2 login, using a **one-time exchange code** instead of ever putting a JWT in a redirect URL.
- Forgot password / reset password via single-use, expiring, hashed tokens.
- Resend verification email.
- Both "forgot password" and "resend verification" always return 200 regardless of whether the account exists, to avoid leaking account existence.

### Session model (stateless, but revocable)
- Neither the access nor the refresh JWT is ever persisted server-side.
- Every JWT carries a `tokenVersion` claim, checked against a `token_version` integer column on `User`.
- `POST /api/auth/logout-all-devices` (and password change) bumps that integer, which instantly invalidates every previously issued access **and** refresh token for that user — a "kill switch" for a stolen token, without a session table.
- `POST /api/auth/refresh` rotates the pair on every use (sliding expiry) so an active user is never forced to re-login.
- `POST /api/auth/logout` is a no-op acknowledgement — nothing to invalidate server-side for a single session, by design.

### Authorization (RBAC)
- Single `Role` enum column on `User` — one role per user, no join table: `ADMIN, ROLE1, ROLE2, ROLE3, ROLE4`.
- `ROLE1..ROLE4` are placeholders for a specific hackathon's actual user types — meant to be renamed.
- Signup requires the caller to choose a role; `ADMIN` cannot be self-assigned (server rejects it with 400).
- `SecurityConfig` restricts `/api/admin/**` to `ADMIN` and `/api/role1..role4/**` to the matching role, each backed by a real (placeholder) controller endpoint — no rule exists without a real endpoint behind it.

### Caching
- Caffeine-backed `@Cacheable`/`@CacheEvict` on the per-request authenticated-user lookup (`CustomUserDetailsService`), so every authenticated request doesn't hit MySQL.
- Every mutation that would make that cache stale (profile update, password change, role change, session revocation) evicts it.
- Separately, a manual Caffeine cache (`OAuth2ExchangeCache`) holds one-time OAuth2 exchange codes (60s TTL) — a nonce store, which is a different shape of problem than the declarative user cache.

### Async email
- All email sending (`@Async`) runs on a dedicated thread pool, never the request thread or the common pool.
- HTML emails via Thymeleaf templates + `MimeMessageHelper` (verification, password reset, welcome) — not plaintext.
- Send failures are caught and logged, never propagated back to roll back the triggering request.

### Rate limiting
- Resilience4j `@RateLimiter` on `/api/auth/{login, signup, forgot-password, resend-verification}`, each with its own limit/period, returning 429 on rejection.

### Exception handling
- A single `@RestControllerAdvice` maps every thrown exception type to the correct HTTP status and a consistent `ErrorResponse` body — every exception type mapped is one that's actually thrown somewhere (no dead handlers).
- Every handled exception is now also logged (`warn` for 4xx, full stack trace at `error` for the generic 500 fallback).

### Logging & observability
- `RequestLoggingFilter` logs every request's method/path/status/duration and stamps a correlation id into MDC, echoed back as an `X-Request-Id` response header — ties every log line for one request together across the filter, the service-layer `LoggingAspect`, and `GlobalExceptionHandler`.
- `LoggingAspect` (AOP `@Around`) logs entry/exit + elapsed time for every service-layer method call.
- Built entirely on SLF4J/Logback — no extra logging dependency.

### API documentation
- Every controller endpoint carries `@Operation` + `@ApiResponses` describing every status code it can actually produce, matched against `GlobalExceptionHandler`'s real mappings.
- The bearer-auth scheme is registered but **not** applied globally — only endpoints that actually require a token show the lock icon in Swagger UI, so public endpoints (signup, login, etc.) aren't misleadingly marked as protected.
- Request/response DTOs carry `@Schema` descriptions/examples where the field name alone doesn't make the contract obvious.

### Future ML integration stub
- `MlClient` — a declarative `@HttpExchange` interface calling a configurable FastAPI base URL (`app.ml.base-url`), built on Spring's `RestClient` (the modern `RestTemplate` replacement).
- `MlController` exposes `POST /api/ml/predict` as an authenticated placeholder passthrough with a deliberately generic `Map<String,Object>` request/response shape, ready to be replaced with the real model contract.

### Scheduled maintenance
- A daily `@Scheduled` job (`TokenCleanupScheduler`) purges expired/used verification and password-reset tokens from the database.

---

## 3. Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Exposed in the JWT `sub` claim and API responses — UUID chosen specifically to avoid sequential-ID enumeration |
| `email` | VARCHAR(120), unique, indexed | normalized (lowercase + trim) in exactly one place (`UserService`) |
| `password_hash` | VARCHAR(255), nullable | null for pure-OAuth2 accounts |
| `first_name`, `last_name` | VARCHAR(50) | |
| `role` | VARCHAR(20) enum | `ADMIN`/`ROLE1..4` |
| `auth_provider` | VARCHAR(20) enum | `MANUAL` / `GOOGLE` |
| `google_id` | VARCHAR(100), nullable, unique, indexed | |
| `is_verified` | BOOLEAN | |
| `token_version` | INT | the one piece of server-side session state — see §2 |
| `created_at` / `updated_at` | TIMESTAMP | |

### `auth_tokens`
Consolidated replacement for what would otherwise be two near-duplicate tables (verification tokens, password-reset tokens).
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT auto-increment (PK) | internal lookup table — the real key is the token hash, not this id, so a sequential PK leaks nothing |
| `token_hash` | VARCHAR(255), unique, indexed | SHA-256 hash — the raw token is never stored |
| `token_type` | VARCHAR(20) enum, indexed | `VERIFICATION` / `PASSWORD_RESET` (refresh tokens are never persisted — see §2) |
| `user_id` | FK → `users.id`, indexed | |
| `expiry_date` | TIMESTAMP | |
| `used` | BOOLEAN | |
| `created_at` | TIMESTAMP | |

---

## 4. End-to-End Flows

### Manual signup → verified login
1. `POST /api/auth/signup {email, password, firstName, lastName, role}` → `UserService` normalizes the email, rejects `role=ADMIN`, creates the user (`is_verified=false`), and `AuthTokenService` issues a hashed `VERIFICATION` token.
2. `EmailService` (async, off the request thread) renders and sends an HTML verification email containing the raw token.
3. `POST /api/auth/verify {token}` → the token is hashed, looked up, marked used, and the user flipped to `is_verified=true`; a welcome email is fired async.
4. `POST /api/auth/login {email, password}` → credentials checked directly against `UserRepository`/`PasswordEncoder`; rejected with 403 if not yet verified. On success, `AuthService` issues an access JWT (45 min, claims: `sub`, `role`, `tokenVersion`) and a refresh JWT (30 days, claims: `sub`, `tokenVersion`, `type=refresh`, signed with a separate secret).
5. The client stores both tokens and sends the access token as `Authorization: Bearer <token>` on subsequent requests.

### Authenticated request
1. `RequestLoggingFilter` runs first (highest precedence), stamping a correlation id into MDC before anything else.
2. `JwtAuthenticationFilter` parses the bearer token, extracts the user id, loads the (cached) `UserPrincipal` via `CustomUserDetailsService`, and compares the token's `tokenVersion` claim against the user's current value.
3. Mismatch → request proceeds unauthenticated → 401 from `JwtAuthenticationEntryPoint`. Match → `SecurityContextHolder` is populated and `SecurityConfig`'s role-based rules apply.
4. Every service method invoked is timed/logged by `LoggingAspect`; any thrown exception is caught by `GlobalExceptionHandler`, logged, and turned into a consistent `ErrorResponse`.

### Refresh (sliding session)
1. `POST /api/auth/refresh {refreshToken}` → the refresh JWT's signature/expiry are verified with the refresh-specific secret, and its `tokenVersion` claim is compared against the user's current value.
2. Valid → a brand-new access+refresh pair is issued (rotation), so an actively-used client never hits the refresh token's 30-day ceiling.
3. Invalid/expired/version-mismatched → 400, client must log in again.

### Stolen-token remediation
1. `POST /api/auth/logout-all-devices` (authenticated) → `UserService.revokeAllSessions` increments `token_version` and evicts the cached principal.
2. Every access and refresh token issued before that moment — including one an attacker is replaying elsewhere — fails the `tokenVersion` check on its very next use, with nothing ever having been stored server-side per-token.

### Google OAuth2 login
1. Client hits `/oauth2/authorization/google` → Google consent screen → Spring Security's OAuth2 login machinery completes → `OAuth2AuthenticationSuccessHandler` fires.
2. The handler finds-or-creates the `User` via one centralized `UserService` method (so email normalization can't drift), generates a random opaque exchange code, and stores it in a 60-second-TTL Caffeine cache mapped to the user's id.
3. Redirects to the frontend with only that opaque code in the query string — never a JWT, never an email.
4. The frontend immediately `POST /api/auth/oauth2/exchange {code}` → the code is looked up and invalidated (one-time use), and a real access+refresh pair is issued exactly like manual login.

### Forgot / reset password
1. `POST /api/auth/forgot-password {email}` → if the account exists, a hashed `PASSWORD_RESET` token is issued and emailed (async); the endpoint returns 200 either way, so account existence isn't leaked.
2. `POST /api/auth/reset-password {token, newPassword}` → token validated/consumed, password re-hashed, and `token_version` bumped — resetting a password also revokes every existing session.

### Role-restricted endpoints
1. `SecurityConfig` maps `/api/role1/**` → `hasRole("ROLE1")` (and similarly for `ROLE2-4`, `ADMIN` → `/api/admin/**`).
2. `RoleController` holds one placeholder GET endpoint per role path (`/api/role1/ping` etc.) — kept in a single controller class since the four are otherwise identical; separation is by path, not by class. Split a role out into its own controller only once its logic actually grows.

---

## 5. Known Trade-offs (deliberate, not oversights)

- **No Flyway / migrations** — `ddl-auto=update` is used instead, by explicit choice, favoring hackathon setup speed over migration history. Fine for a fresh-DB-per-hackathon workflow; would need reconsidering for anything longer-lived.
- **No Spring profiles / multiple environments** — a single `application.properties`, by explicit choice, since this targets a single-environment hackathon deployment rather than dev/staging/prod separation.
- **No `.env` file mechanism** — secrets come from real environment variables (`${VAR}` placeholders in `application.properties`), set via the IDE run configuration or shell, not a checked-in or gitignored dotfile.
- **Logout is a client-side no-op** — an accepted consequence of the stateless JWT design; only `logout-all-devices` actually revokes anything server-side.

---

## 6. Suggested Improvements (not yet built)

Roughly in priority order for hackathon usefulness:

1. **Docker Compose for MySQL** — a `docker-compose.yml` that stands up MySQL with the right DB/credentials in one command, removing the "install MySQL locally" step at the start of every hackathon.
2. **Dev seed data on startup** — a `CommandLineRunner` that creates a ready-to-use `ADMIN` + one account per `ROLEn` on first boot if the `users` table is empty, so teammates can skip signup/email-verification during iteration.
3. **Committed Postman/Insomnia collection** — every endpoint with example bodies, including the multi-step auth flows (signup→verify→login→refresh) that are tedious to click through in Swagger UI alone.
4. **A real test suite** — currently only the default Spring Boot smoke test exists. Worth adding: `AuthService` signup/login unit tests, a `JwtService` issue/validate/tamper test, and a Testcontainers-backed repository test (real MySQL instead of relying on `ddl-auto=update` matching production behavior).
5. **Per-role domain logic** — `RoleController`'s four ping endpoints are intentionally trivial placeholders; the real value only appears once actual per-role business logic (and possibly per-role DTOs/services) gets built on top.
6. **Refresh-token secret rotation strategy** — currently a single long-lived static secret per token type; fine for a hackathon's lifespan, but worth a documented rotation plan if this base is ever reused beyond one event.
7. **Structured JSON logging** — the current logging setup (correlation id + plain-text pattern) is deliberately kept dependency-free; if logs ever need to ship to an aggregator (ELK/Datadog), swapping in `logstash-logback-encoder` is a contained change.
8. **File/image upload support** — a common hackathon need not yet covered; would require a storage abstraction (local disk vs. S3-compatible) and a multipart upload endpoint.
9. **Real-time updates (WebSocket/SSE)** — another common hackathon need with no current stub; worth adding if a project's judged demo depends on live updates.
