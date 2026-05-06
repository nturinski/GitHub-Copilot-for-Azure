# Database Migrations

Detect, configure, auto-run DB migrations before local dev sessions. Migrations run automatically after emulators start via `docker compose up -d`.

---

## Overview

Migrations are **not** a separate manual step. When detected, incorporated into `docker-compose.yml` as one-shot service running automatically during "Start Emulators" step. No IDE task/build chain changes needed:

```
Debug start → "{host start task}"
       ├── dependsOn: "{build/watch step}"
       │                └── ... build chain ...
       └── dependsOn: "Start Emulators"  ← docker compose up -d
                        ├── Database service starts → healthcheck confirms readiness
                        └── Migration service waits for healthy → runs migrations → exits
```

---

## Detection

Detection is **evidence-based, not opinionated**. Scan three workspace layers — files, dependencies, scripts — then synthesize findings. Don't assume a tool; let evidence decide.

### Layer 1: Migration Files

Scan for migration definitions: tool-specific config files, migration directories, naming patterns.

#### Examples:

- `prisma/migrations/` → Prisma (Node.js)
- `alembic/`, `alembic.ini` → Alembic (Python)
- `**/migrations/*.py` → Django (Python)
- `Migrations/*.cs` → Entity Framework Core (.NET)
- `flyway.conf` → Flyway / Liquibase (Java)
- `migrations/*.sql` → Raw SQL (no tool)

> Not exhaustive — if migration-like files don't match known patterns, examine them to identify tool.

### Layer 2: Dependencies

Check dependency manifests (`package.json`, `requirements.txt`, `*.csproj`, `go.mod`) for migration tools (`alembic`, `drizzle`), ORMs with migration support (`prisma`, `TypeORM`, `Django`), and DB driver packages (`pg`, `mysql2`) — drivers confirm target DB even without migration tool.

### Layer 3: Scripts

Check script runners (`package.json`, `Makefile`, `pyproject.toml`) for migration commands. Grep for `migrate`, `schema`, `seed`, known tool names. Key signal: any command applying schema changes.

### Synthesis

After scanning all layers, determine:

1. **Which migration tool is in use** — Cross-reference files, deps, scripts. All layers should agree. If conflict (e.g., both Alembic and Django), ask user which is active.
2. **Whether existing migration command exists** — If project has working migration script/command, use it directly.
3. **Whether migration command needs building** — If tool is clear from deps/files but no script exists, construct appropriate command from tool docs.

> **Prefer existing scripts.** If project has migration script, wrap it in docker-compose service rather than building parallel command.

### Insufficient Evidence

If DB dependency detected (e.g., `pg` in deps, PostgreSQL in docker-compose) but **no layer reveals a clear migration strategy** — no migration files, no migration tool in deps, no migration scripts — then:

1. **Don't guess.** Don't assume raw SQL or any tool.
2. **Ask user** via `ask_user`:
   - Explain what was found (DB dependency without migration strategy)
   - Ask how they manage schema changes (e.g. "Do you use a migration tool, raw SQL files, or manage the schema manually?")
   - Offer to skip migration setup
3. **Record gap** in plan:

```markdown
### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | ⚠️ Not detected — awaiting user input |
| Evidence | Database dependency found but no migration files, tools, or scripts detected |
| Target Database | {database type} (`{compose service name}` service) |
| Auto-Migrate | Pending user response |
```

### What to Record

When migrations detected, add to scan results:

```markdown
### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | {tool name} |
| Evidence | {what was found: files, deps, scripts} |
| Migration Directory | {path} (if applicable) |
| Migration Command | {existing script or constructed command} |
| Target Database | {database type} (`{compose service name}` service) |
| Auto-Migrate | Yes (docker-compose service) |
```

---

## Docker Compose Patterns

Two patterns needed when migrations detected: **healthcheck** on DB service for readiness, and one-shot **migration service** that waits for healthcheck, applies changes, exits.

### Database Emulators

| Database | Emulator Reference |
|----------|--------------------|
| PostgreSQL | [emulators/postgres.md](emulators/postgres.md) |
| SQL Server / SQL Edge | [limited-support.md](limited-support.md) |
| MySQL | [limited-support.md](limited-support.md) |
| CosmosDB | [limited-support.md](limited-support.md) |
| MongoDB | [limited-support.md](limited-support.md) |

> 💡 **No emulator reference file?** Emit limited support warning per [limited-support.md](limited-support.md), then best-effort attempt using patterns below.

### Healthcheck Pattern

When migrations present, target DB service **must** have healthcheck so migration service can use `depends_on` with `condition: service_healthy`. Healthcheck definition belongs in emulator's docker-compose config — see [Database Emulators](#database-emulators) table for reference file with each DB's healthcheck block.

For DBs without emulator reference file, construct best-effort healthcheck verifying DB accepts connections via its CLI client.

### Migration Service Pattern

Goal: **single standardized flow** — every project gets migration script in native script runner (e.g. `npm run db:migrate`, `make db-migrate`). Docker-compose migration service calls that script; developer can also run it manually against any target.

#### Step 1: Ensure a Migration Script Exists

| Detection Evidence | Instruction |
|--------------------|-------------|
| Existing migration script in project (e.g., `npm run db:migrate`) | Use as-is. Skip to Step 2. |
| Migration tool detected (e.g., Prisma, Alembic, EF Core) but no script | Create script in native script runner wrapping tool's CLI (e.g., `"db:migrate": "npx prisma migrate deploy"` in `package.json`). |
| Raw SQL files only (`migrations/*.sql`), no migration tool | Recommend/install lightweight migration tool as dev dependency (e.g., `node-pg-migrate` for Node.js, `golang-migrate` for Go, `alembic` for Python). Configure for existing `migrations/` dir, create wrapping script. Ask user before installing. |

> **Why install tool for raw SQL?** Gives proper CLI, idempotency tracking (no re-runs), consistent interface. Eliminates DB-specific shell scripts; same project script works against any target — local container, remote dev, staging, etc.

#### Step 2: Wire the Script into Docker Compose

Migration service calls project's migration script inside container with correct runtime.

```yaml
services:
  db-migrate:
    image: ${RUNTIME_IMAGE}
    working_dir: /app
    depends_on:
      ${DATABASE_SERVICE}:
        condition: service_healthy
    volumes:
      - ./:/app:ro
      ${EXTRA_VOLUME_MOUNTS}
    environment:
      ${CONNECTION_ENV_VAR}: ${CONNECTION_STRING_FOR_COMPOSE_NETWORK}
    entrypoint: ${MIGRATION_SCRIPT}
    restart: "no"
```

**Filling in template — use detected evidence:**

| Placeholder | How to determine |
|-------------|-----------------|
| `RUNTIME_IMAGE` | Docker image providing project's language runtime. See table below. |
| `DATABASE_SERVICE` | Compose service name for target DB (e.g., `postgres`, `sqlserver`) |
| `CONNECTION_ENV_VAR` | Env var migration tool expects. Check tool's config, `local.settings.json`, `.env`, or framework conventions. |
| `CONNECTION_STRING_FOR_COMPOSE_NETWORK` | Same shape as local connection string but compose service name as host instead of `localhost` (e.g., `postgresql://postgres:postgres@postgres:5432/localdev`) |
| `EXTRA_VOLUME_MOUNTS` | Additional mounts for ecosystem (e.g., `node_modules`, `.venv`). See table below. |
| `MIGRATION_SCRIPT` | Project's migration script command (e.g., `["npm", "run", "db:migrate"]`, `["make", "db-migrate"]`) |

**Runtime images and extra volume mounts:**

| Ecosystem | Image | Extra Volume Mounts | Notes |
|-----------|-------|-------------------|-------|
| Node.js / TypeScript | `node:{major}-slim` | `./node_modules:/app/node_modules:ro` | Mount node_modules separately for native modules |
| .NET | [limited-support.md](limited-support.md) | | |
| Python | [limited-support.md](limited-support.md) | | |
| Java | [limited-support.md](limited-support.md) | | |
| Go | [limited-support.md](limited-support.md) | | |

> 💡 **Limited support runtimes:** For ecosystems without full config above, emit limited support warning per [limited-support.md](limited-support.md), then best-effort attempt. Choose slim official Docker image (e.g., `python:{version}-slim`, `mcr.microsoft.com/dotnet/sdk:{version}`), mount project read-only, include dependency dirs migration tool needs. Same docker-compose invariants apply.

> **Key properties:**
> - `depends_on` with `condition: service_healthy` — waits for DB to accept connections
> - `volumes` with `:ro` — mounts project read-only for safety
> - `restart: "no"` — runs once per `docker compose up`, no restart after exit
> - Mount ecosystem-specific dependency dirs (e.g., `node_modules`, `.venv`) when migration tool installed as project dependency

#### Result

After both steps, developer has:

- **One script** (`npm run db:migrate` / `make db-migrate`) running migrations against any target via env vars
- **Automatic migration** on `docker compose up -d` via `db-migrate` service
- **Manual migration** by invoking script directly — can target localhost, remote dev DB, staging, etc.
