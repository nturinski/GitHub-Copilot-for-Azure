# Inventory Dependencies

Scan workspace for Azure service deps, emulator requirements, prerequisite tools, migration config, and API test collection opportunities. Feeds directly into plan.

> Multi-service workspaces: loop each service in `services[]` from `classify.md`. Run steps 1–4 per service; deduplicate emulators/prerequisites across services via shared workspace context from [multi-service.md](multi-service.md).

---

## Step 1: Identify Azure Service Dependencies

Load discovery ruleset for current project type, apply to workspace. Project type determines **how** to discover deps — binding scan vs SDK scan.

### 1a. Functions: Binding Scan

Parse `function.json` files **or** decorator/attribute-based bindings in source code.

> **Default: Azure emulators first.** Prefer official Azure-provided emulator. Fall back to third-party/generic container only when no Azure emulator exists (e.g., PostgreSQL).

| Binding Type | Azure Service | Emulator Reference |
|-------------|---------------|-------------------|
| `blobTrigger`, `blob` (input/output) | Azure Blob Storage | [emulators/azurite.md](emulators/azurite.md) |
| `queueTrigger`, `queue` (output) | Azure Queue Storage | [emulators/azurite.md](emulators/azurite.md) |
| `tableTrigger`, `table` (input/output) | Azure Table Storage | [emulators/azurite.md](emulators/azurite.md) |
| `httpTrigger` | (none — built into Functions host) | — |
| `timerTrigger` | (none — built into Functions host) | — |
| `cosmosDBTrigger`, `cosmosDB` (input/output) | Azure Cosmos DB | [limited-support.md](limited-support.md) |
| `serviceBusTrigger`, `serviceBus` (output) | Azure Service Bus | [limited-support.md](limited-support.md) |
| `eventHubTrigger`, `eventHub` (output) | Azure Event Hubs | [limited-support.md](limited-support.md) |
| `signalR`, `signalRConnectionInfo` | Azure SignalR | No local emulator — use dev-tier Azure instance |
| `sql`, `sqlTrigger` | Azure SQL | [limited-support.md](limited-support.md) |

### 1b. Container App / App Service: SDK Scan

Non-Functions projects: scan dependency files for Azure SDK packages implying service usage.

| Package Pattern | Azure Service | Emulator Reference |
|----------------|---------------|-------------------|
| `@azure/storage-blob`, `@azure/storage-queue` | Azure Storage | [emulators/azurite.md](emulators/azurite.md) |
| `@azure/cosmos` | Cosmos DB | [limited-support.md](limited-support.md) |
| `@azure/service-bus` | Service Bus | [limited-support.md](limited-support.md) |
| `@azure/event-hubs` | Event Hubs | [limited-support.md](limited-support.md) |
| `@azure/data-tables` | Table Storage | [emulators/azurite.md](emulators/azurite.md) |
| `mssql` | Azure SQL | [limited-support.md](limited-support.md) |
| `pg`, `postgres`, `@prisma/client` (postgres provider) | PostgreSQL¹ | [emulators/postgres.md](emulators/postgres.md) |

> ¹ PostgreSQL has no Azure-provided emulator. If project targets **Azure Cosmos DB for PostgreSQL**, no local emulator available — flag in plan.

### 1c. Connection String Scan

Check connection references in `local.settings.json`, `.env`, or app config:

```bash
# Check local.settings.json for connection values
cat local.settings.json 2>/dev/null | grep -i "connection\|storage\|database\|cosmos\|sql\|servicebus"

# Check .env files
cat .env .env.local .env.development 2>/dev/null | grep -i "connection\|storage\|database"
```

---

## Step 2: Detect Database Migrations

On database dependency detected, run detection/synthesis in [migrations.md](migrations.md) to identify migration tool and record results. Set up docker-compose services that automate database migrations.

---

## Step 3: Detect Existing Configurations

Check which local dev artifacts exist in workspace:

| File | Status Values |
|------|--------------|
| IDE debug/launch config (see [ide/{ide}.md](ide/)) | Found / Not found |
| IDE task/build config (see [ide/{ide}.md](ide/)) | Found / Not found |
| `docker-compose.yml` or `docker-compose.yaml` | Found / Not found |
| `local.settings.json` (Functions) | Found / Not found |
| `.env` / `.env.local` | Found / Not found |
| `api-test-collections/local-development/` | Found / Not found |
| `migrations/` or ORM config | Found / Not found |
| Migration script (e.g., `db:migrate` in `package.json`) | Found / Not found |

If existing config found, note in plan and ask user — generate phase defaults to **merge**, not overwrite.

## Step 4: Detect Prerequisites

Check required tools on dev machine. Only check tools relevant to detected project type/runtime.

| Tool | Detection Command | Required For |
|------|-------------------|-------------|
| Azure CLI | `az --version` | Some API test collection scripts |
| Azure Functions Core Tools | `func --version` | Running Functions host locally |
| Node.js | `node --version` | Node.js / TypeScript projects |
| npm | `npm --version` | Node.js dependency management |
| Docker | `docker --version` | Running emulators |
| Docker Compose | `docker compose version` | Orchestrating emulators |
| .NET SDK | `dotnet --version` | .NET projects |

---

## Step 5: Discover API Test Collection Opportunities

Identify endpoints/triggers benefiting from test scripts.

### HTTP Triggers

List all HTTP-triggered functions with routes and methods:

```markdown
| Function | Route | Method | Auth Level |
|----------|-------|--------|------------|
| HealthCheck | /api/HealthCheck | GET | anonymous |
| ProcessOrder | /api/ProcessOrder | POST | function |
```

### Non-HTTP Triggers

List triggers needing sample data or invocation scripts:

```markdown
| Function | Trigger Type | Required Data |
|----------|-------------|---------------|
| ProcessBlob | blobTrigger | Sample blob upload to `uploads` container |
| HandleMessage | queueTrigger | Sample queue message |
```

---

## Output

Consolidate findings into scan summary for plan:

```markdown
## Inventory Results

### Dependencies → Emulators

| Azure Service | Detected Via | Emulator | Reference |
|---------------|-------------|----------|-----------|
| Azure Blob Storage | blobTrigger binding | Azurite | emulators/azurite.md |
| PostgreSQL | `pg` package | postgres:16 | emulators/postgres.md |

### Existing Configuration

| File | Status |
|------|--------|
| IDE debug/launch config | Not found |
| docker-compose.yml | Not found |
| local.settings.json | Found |

### HTTP Endpoints

| Function | Route | Method |
|----------|-------|--------|
| HealthCheck | /api/HealthCheck | GET |

### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | Raw SQL |
| Migration Directory | `migrations/` |
| Target Database | PostgreSQL (`postgres` service) |

### Prerequisites

| Tool | Installed | Version |
|------|-----------|---------|
| Node.js | ✅ | v20.11.0 |
| Docker | ✅ | 24.0.7 |
| func | ❌ | — |
```
