# Project Plan: Todo List App

**Status**: Approved
**Created**: 2026-04-28
**Mode**: NEW

---

## 1. Project Overview

**Goal**: A simple, testable todo list application with user authentication. Users can create, list, complete, and delete todo items. Every module is independently testable.

**App Type**: SPA + API

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Runtime & Framework

| Component | Technology |
|-----------|-----------|
| **Runtime** | TypeScript |
| **Backend** | Azure Functions v4 |
| **Frontend** | React + Vite |
| **Package Manager** | npm |

---

## 3. Test Runner & Configuration

| Component | Technology |
|-----------|-----------|
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| PostgreSQL | Primary data store for users and todos | DATABASE_URL | postgresql://localdev:localdevpassword@localhost:5432/appdb | Essential |
| Blob Storage | Avatar uploads | STORAGE_CONNECTION_STRING | UseDevelopmentStorage=true | Enhancement |

---

## 5. Project Structure

```
src/
  functions/
    src/
      functions/        # one file per HTTP function
      services/
        interfaces/
        registry.ts
      utils/
    seeds/
      fixtures/
      seed.ts
    host.json
    local.settings.json
    package.json
    tsconfig.json
  shared/
    schemas/
    types/
    package.json
    tsconfig.json
  web/
    src/
      api/
      pages/
      components/
    package.json
    vite.config.ts
.azure/
  project-plan.md
  execution-checklist.md
.env.example
```

---

## 6. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Auth | Status Codes |
|---|--------|------|-------------|-------------|--------------|------|-------------|
| 1 | GET | `/api/health` | Health check | — | `{ status, services }` | None | 200, 503 |
| 2 | POST | `/api/auth/register` | Register user | `{ email, password }` | `{ user, token }` | None | 201, 400, 422 |
| 3 | POST | `/api/auth/login` | Login | `{ email, password }` | `{ user, token }` | None | 200, 401, 422 |
| 4 | GET | `/api/todos` | List todos | — | `{ items: Todo[] }` | Bearer | 200, 401 |
| 5 | POST | `/api/todos` | Create todo | `{ title, dueDate? }` | `Todo` | Bearer | 201, 400, 422 |
| 6 | PATCH | `/api/todos/:id` | Toggle/update | `{ completed?, title? }` | `Todo` | Bearer | 200, 401, 404 |
| 7 | DELETE | `/api/todos/:id` | Delete todo | — | — | Bearer | 204, 401, 404 |

---

## 7. Database Constraints

| Table | Constraint Type | Column(s) | Detail |
|-------|----------------|-----------|--------|
| users | UNIQUE | email | Prevent duplicate registration |
| todos | FK | user_id → users.id | ON DELETE CASCADE |
| todos | CHECK | title length > 0 | Reject empty titles |
| todos | INDEX | (user_id, created_at) | Optimize list query |

### 7a. Collection-to-Table Name Mapping

| Collection Name (handler code) | SQL Table Name (migration) | Mapping Rule |
|-------------------------------|---------------------------|--------------|
| `'user'` | `users` | camelToSnake + pluralize |
| `'todo'` | `todos` | camelToSnake + pluralize |

---

## 8. Service Dependency Classification

| Service | Type | Failure Behavior |
|---------|------|-----------------|
| PostgreSQL | Essential | Request fails with 503 |
| Blob Storage | Enhancement | Avatar upload silently disabled, default avatar used |

---

## 9. Execution Checklist

### High-Level Phases
- [ ] Step 1: Foundation (project config, directory structure, build verification)
- [ ] Step 2: Configuration & Environment (config module, .env, local.settings.json)
- [ ] Step 3: Service Abstraction Layer (interfaces + concrete implementations + registry)
- [ ] Step 4: Database Schema & Migrations (users, todos)
- [ ] Step 5: Shared Types & Validation Schemas
- [ ] Step 6: API Routes / Functions (one handler per route)
- [ ] Step 7: Error Handling Middleware
- [ ] Step 8: Health Check Endpoint
- [ ] Step 9: OpenAPI Contract
- [ ] Step 10: Structured Logging
- [ ] Step 11: Wire Frontend
- [ ] Step 12: Wrap Up

---

## 10. Files to Generate

| File | Action | Description |
|------|--------|-------------|
| `src/functions/package.json` | CREATE | Functions workspace manifest |
| `src/functions/host.json` | CREATE | Functions host config |
| `src/functions/local.settings.json` | CREATE | Local emulator env vars |
| `src/functions/src/services/interfaces/IDatabaseService.ts` | CREATE | DB service contract |
| `src/functions/src/services/database.ts` | CREATE | Concrete pg implementation |
| `src/functions/src/services/registry.ts` | CREATE | Service registry with auto-init |
| `src/functions/src/functions/health.ts` | CREATE | Health check handler |
| `src/functions/src/functions/register.ts` | CREATE | Register handler |
| `src/functions/src/functions/login.ts` | CREATE | Login handler |
| `src/functions/src/functions/listTodos.ts` | CREATE | List todos handler |
| `src/functions/src/functions/createTodo.ts` | CREATE | Create todo handler |
| `src/functions/src/functions/updateTodo.ts` | CREATE | Update todo handler |
| `src/functions/src/functions/deleteTodo.ts` | CREATE | Delete todo handler |
| `src/functions/seeds/seed.ts` | CREATE | Idempotent seed script |
| `src/functions/seeds/fixtures/seed-data.json` | CREATE | Seed data fixtures |
| `src/shared/package.json` | CREATE | Shared workspace manifest |
| `src/shared/types/entities.ts` | CREATE | User and Todo entity types |
| `src/shared/schemas/auth.ts` | CREATE | Zod schemas for auth |
| `src/shared/schemas/todos.ts` | CREATE | Zod schemas for todos |
| `src/web/package.json` | CREATE | Frontend workspace manifest |
| `src/web/vite.config.ts` | CREATE | Vite config with /api proxy |
| `.env.example` | CREATE | Documented env var template |

---

## 11. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-verify** for test coverage
3. Run **azure-localdev** for Docker emulators and VS Code debugging
4. Run **azure-prepare** → **azure-deploy** when ready to deploy
