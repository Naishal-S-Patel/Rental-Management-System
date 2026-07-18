# Hackathon Starter v2 — Backend

Reusable Spring Boot backend base for hackathons, built in `Backend/starter`. Full design rationale lives in the plan at
`~/.claude/plans/i-need-to-build-ethereal-lemon.md` — read it for the "why" behind decisions below before making
structural changes.

## Stack
- Spring Boot **4.1.0**, Java **21**, MySQL (`com.mysql:mysql-connector-j`)
- Package root: `com.hackathon.starter`
- Schema: `spring.jpa.hibernate.ddl-auto=update` (no Flyway, by design — hackathon speed over migration history)
- Config: single `application.properties`, no Spring profiles/multiple environments (single-environment hackathon
  use case, by design) — secrets still come from `${ENV_VAR}` placeholders, not hardcoded values.

## Spring Boot 4 naming gotchas (confirmed against the 4.1.0 BOM — don't "fix" these back to Boot-3 names)
- `spring-boot-starter-web` → **`spring-boot-starter-webmvc`**
- `spring-boot-starter-oauth2-client` → **`spring-boot-starter-security-oauth2-client`**
- `spring-boot-starter-aop` → **`spring-boot-starter-aspectj`**
- No single umbrella `spring-boot-starter-test` — each starter has its own matching `-test` artifact
  (`spring-boot-starter-actuator-test`, `-cache-test`, `-data-jpa-test`, `-security-oauth2-client-test`,
  `-security-test`, `-webmvc-test`, `-mail-test`, `-validation-test`, `-aspectj-test`). Add the matching
  `-test` artifact whenever a new starter is added.
- Spring Framework version under Boot 4.1.0 is **7.0.8** — be wary of tutorials/snippets written for Spring 6/Boot 3.
- `springdoc-openapi-starter-webmvc-ui` must be **3.0.x**, not 2.x (2.x targets Boot 3's `spring-boot-starter-web` naming).
- `resilience4j-spring-boot3:2.4.0` (latest available; no Boot4-named artifact exists yet) — confirmed compatible via
  its `AutoConfiguration.imports` mechanism and a clean `dependency:tree`/`compile` run. No fallback needed.

## Core architecture decisions (see plan file for full detail)
- **Auth**: JWT access token (45 min) + JWT refresh token (30 days), **both stateless — neither is persisted**.
  Revocation works via a single `token_version` int column on `User`; bumping it invalidates every outstanding
  access+refresh token for that user instantly (used for "logout everywhere" / stolen-token scenarios). Do not
  reintroduce a persisted refresh-token/session table — that was deliberately rejected in favor of this scheme.
- **Roles**: single enum column on `User` (`Role`: `ADMIN, ROLE1, ROLE2, ROLE3, ROLE4`) — one role per user, no join
  table. `ROLE1..ROLE4` are deliberate placeholders for this hackathon's actual user types — rename them (and the
  matching `/api/role1..role4/**` SecurityConfig rules + `RoleController` endpoints) together. Signup
  (`SignupRequest.role`) requires the caller to pick one of them; `ADMIN` cannot be self-assigned
  (`UserService.createManualUser` throws `BadRequestException`) — grant it manually (DB/console) instead. Every
  `hasRole(...)` rule in `SecurityConfig` must have a real endpoint behind it, per the dead-rule flaw fixed earlier —
  don't add a role restriction without one. `RoleController` deliberately holds all four placeholder endpoints in
  one class (separation is by request path, which is what SecurityConfig's matchers key off) rather than one
  near-identical controller class per role — split a role's endpoints into their own controller only once that
  role's logic actually grows into something substantial, not preemptively.
- **Caching**: Spring Cache abstraction (`@Cacheable`/`@CacheEvict`) backed by Caffeine for the per-request cached
  user/principal lookup (cache name `"users"`). The OAuth2 exchange-code store is the one exception — a manual
  Caffeine `Cache<String,UUID>` bean, since a write-once/read-once/invalidate nonce doesn't fit `@Cacheable`.
- **Tokens table**: `auth_tokens` holds only `VERIFICATION` and `PASSWORD_RESET` types (refresh tokens are NOT
  stored — see Auth above). SHA-256 hash stored, never the raw token.
- **UUID vs BIGINT**: `User.id` is UUID (exposed in JWT `sub`/API responses — avoids ID enumeration).
  `AuthToken.id` is a plain BIGINT auto-increment — it's an internal lookup table keyed by token hash, not by id,
  so a sequential PK leaks nothing.
- **Email**: async only (`@Async` on a dedicated executor bean, never the common pool), HTML via Thymeleaf +
  `MimeMessageHelper` — never block the request thread on SMTP, never plain text.
- **OAuth2 (Google)**: never put a JWT in the redirect URL. Success handler mints a one-time opaque exchange code
  (Caffeine, 60s TTL), frontend exchanges it via `POST /api/auth/oauth2/exchange` for the real token pair.
- **Rate limiting**: Resilience4j `@RateLimiter` on `/api/auth/{login,signup,forgot-password,resend-verification}`.
- **ML integration stub**: Spring `RestClient` + declarative `@HttpExchange` interface (`client.MlClient`) — not
  OpenFeign (avoids an extra Spring Cloud dependency of uncertain Boot4 compatibility). This is a placeholder for a
  future FastAPI service call.
- **Exceptions**: every custom exception type must have a real throw site — no dead exception classes/handlers.
- **Security permitAll rules**: must be an explicit enumerated list matching real endpoints — no blanket wildcards,
  no rules referencing controllers that don't exist.

## Secrets
Never hardcode secrets in `application.properties`. Use `${ENV_VAR}` placeholders for `DB_PASSWORD`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `MAIL_USERNAME`/`MAIL_PASSWORD`.

## Local storage-service module (`Backend/storage-service`)
A separate, standalone Spring Boot 4.1.0 app (own `pom.xml`, own port `8081`, package root
`com.hackathon.storage_service`) — a minimal local S3 clone for hackathons with no cloud storage access. **Not**
part of `starter`'s Maven build or Spring context; run it independently (`./mvnw spring-boot:run` from
`Backend/storage-service`). Full design in the plan file.
- **Deliberately has zero auth/authz/encryption/versioning/quotas/lifecycle policies** — `userId` is just a
  caller-supplied string, never validated against `starter`'s `users` table. The two apps are intentionally decoupled.
- **Storage root**: `Backend/storage/` (relative path, `storage.root-dir=../storage`, overridable via
  `STORAGE_ROOT_DIR`) — created in `main()` *before* `SpringApplication.run(...)`, because the SQLite `DataSource`
  bean (and `schema.sql`) initializes before any `CommandLineRunner` and SQLite can't create a db file inside a
  missing directory. Don't move that directory-creation logic into a `CommandLineRunner`/`@PostConstruct` — it'll
  break on a fresh checkout.
- **Physical file layout**: `storage/users/{userId}/{fileId}/{originalFileName}` — `fileId` is a server-generated
  UUID, which is also what makes each path collision-proof.
- **Metadata**: SQLite (`storage/metadata.db`) via plain `JdbcTemplate` (`FileMetadataRepository`) — deliberately
  **not** Spring Data JPA/Hibernate, to avoid depending on Hibernate's community SQLite dialect against a very
  recent Hibernate version. Don't reach for `@Entity`/`@Repository extends JpaRepository` here; add a plain SQL
  method to `FileMetadataRepository` instead.
- **Upload/download URLs**: the "generated URL" is just the real REST resource URL (`/api/files/{fileId}/content`)
  — no signing, no expiry, no token, matching "no auth" — a two-step shape purely to mirror S3's UX.
- **Endpoints**: `POST /api/files/upload-url`, `PUT /api/files/{fileId}/content` (multipart), `GET
  /api/files/{fileId}/download-url`, `GET /api/files/{fileId}/content`. Nothing beyond these four — don't add a
  list/browse endpoint or extra metadata endpoints without the user asking; the scope here is intentionally frozen
  to a specific checklist.

### How `starter` calls it
`starter` never talks to SQLite or the disk directly — it calls storage-service over HTTP, same pattern as
`MlClient`/`MlController`:
- `client.StorageClient` (`@HttpExchange`, in `starter`) mirrors storage-service's 4 endpoints exactly, using
  internal DTOs in `dto.storage.*` that match storage-service's JSON shapes field-for-field.
- `config.RestClientConfig` wires a second `RestClient`/`HttpServiceProxyFactory` pair for it, base URL from
  `app.storage.base-url` (default `http://localhost:8081`).
- `controller.StorageController` (`/api/storage/**`, authenticated like everything else in `starter`) is the
  public surface a frontend actually calls. It **always supplies `userId` from the authenticated
  `UserPrincipal`**, never from the request body — the frontend can't choose whose storage prefix it writes to.
  It also **rewrites** storage-service's raw `uploadUrl`/`downloadUrl` (which point at storage-service's own port)
  into `starter`'s own `/api/storage/{fileId}/content` route before returning them — never leak storage-service's
  URL directly to a frontend caller.
- This is scaffolding, same spirit as `MlController`: the real per-problem-statement logic (which file types are
  allowed, extra access checks, listing a user's files, etc.) gets built on top of this once the actual hackathon
  problem statement is known.

## Logging
- `RequestLoggingFilter` (`logging` package, registered via `LoggingFilterConfig` at `Ordered.HIGHEST_PRECEDENCE`
  so it wraps the Spring Security filter chain too) logs every request's method/path/status/duration and stamps a
  correlation id into MDC (`requestId`), echoed back as the `X-Request-Id` response header. The console log pattern
  (`logging.pattern.console`) includes `%X{requestId}` so every log line for one request — filter, `LoggingAspect`
  on the service layer, `GlobalExceptionHandler` — can be tied together. No new logging library; plain SLF4J/Logback
  (already ships with Boot).
- `GlobalExceptionHandler` logs every handled exception (`warn` for 4xx, `error` with the full stack trace for the
  generic 500 handler) — don't remove this, it was the actual debugging gap before.
- Keep using SLF4J (`LoggerFactory.getLogger(...)`) in new services — don't introduce a second logging façade.

## OpenAPI
- Every controller method must carry `@Operation` + `@ApiResponses` (each response code mapped in
  `GlobalExceptionHandler` that the endpoint can actually produce, with the correct DTO in `@Content`/`@Schema`) —
  this repo's actual convention, not optional decoration. Follow the existing controllers as the template.
- `OpenApiConfig` registers the `bearerAuth` scheme but deliberately does **not** apply it globally — only
  protected endpoints/controllers carry `@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)`, so Swagger UI's
  lock icon accurately reflects which endpoints need a token (public auth endpoints don't get one).
- Request/response DTOs carry `@Schema` descriptions/examples on fields where the name alone doesn't make the
  contract obvious (e.g. token fields, normalization behavior) — keep doing this for new DTOs.
