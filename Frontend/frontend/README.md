# Hackathon Starter — Frontend

React 19 + Vite + TypeScript + Tailwind CSS v4, wired up to the `Backend/starter` Spring Boot API's auth, RBAC, and OAuth2 flows.

## Stack

- **React 19** + **Vite** + **TypeScript** (strict)
- **Tailwind CSS v4** via `@tailwindcss/vite` (CSS-first config, no `tailwind.config.js` needed)
- **react-router-dom** for routing
- **axios** for API calls, with a request/response interceptor that attaches the access token and transparently refreshes it on 401 (see `src/lib/api.ts`)
- **react-hot-toast** for notifications, **react-icons**, **clsx**
- **ESLint** (TypeScript + React Hooks rules) + **oxlint** (fast complementary linter) + **Prettier**

## Getting started

```bash
npm install
npm run dev
```

By default the API base URL is `http://localhost:8080` (see `src/lib/api.ts`). Override it with
`VITE_API_BASE_URL` if the backend runs elsewhere (e.g. a `.env.local` file with
`VITE_API_BASE_URL=http://localhost:8081`).

Run the backend (`Backend/starter`) alongside this for the auth flows to actually work.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Typecheck only |
| `npm run lint` | oxlint, then ESLint |
| `npm run lint:fix` | Same, with autofix |
| `npm run format` / `format:check` | Prettier write / check |

## Structure

```
src/
  api/          axios calls grouped by backend controller (authApi, userApi, roleApi)
  components/   shared UI (ProtectedRoute, form primitives, Navbar, ...)
  context/      AuthContext - the single source of truth for auth state
  hooks/        useAuth()
  lib/          axios instance + interceptors, token storage, error-message helper
  pages/        one component per route
  types/        types mirroring the backend's DTOs (dto/request, dto/response, enums.Role)
```

## Auth flow, in brief

- Tokens are stored in `localStorage` via `src/lib/tokenStorage.ts` - swap that module out (e.g. for
  an httpOnly-cookie BFF) without touching any call sites.
- `src/lib/api.ts` attaches the access token to every request and, on a 401, transparently calls
  `/api/auth/refresh` once (deduped across concurrent requests) and retries the original request.
  If the refresh itself fails, it clears tokens and redirects to `/login`.
- `AuthContext` exposes `login`, `signup`, `logout`, `logoutAllDevices`, `exchangeOAuth2Code`, and the
  current `user`/`status`. Every page reads auth state through `useAuth()`.
- `ProtectedRoute` guards authenticated routes (and optionally specific roles) - client-side UX only;
  the backend's `SecurityConfig` is the real enforcement point.
- The `Role` type (`ADMIN | ROLE1 | ROLE2 | ROLE3 | ROLE4`) mirrors the backend's placeholder enum -
  rename both together when adapting this to a specific hackathon. `DashboardPage` demonstrates
  calling the role-scoped `/api/role{n}/ping` endpoint as a working RBAC example.
