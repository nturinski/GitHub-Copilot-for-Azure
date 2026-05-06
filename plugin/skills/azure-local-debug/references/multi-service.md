# Multi-Service Orchestration

> `classify.md` produces `services[]` array. If array has **more than one entry**, this phase runs between classify and inventory to assemble shared workspace context before discovery begins.

---

## Service ID Assignment

Each service root gets short ID for namespacing tasks and launch configs. Derived in priority order:

1. **Project manifest name** — from package manager/build file, lowercased and kebab-cased:

   | Runtime | File | Field |
   |---------|------|-------|
   | node | `package.json` | `"name"` |
   | dotnet | `*.csproj` | `<AssemblyName>`; falls back to `.csproj` filename without extension |
   | python | `pyproject.toml` | `name` under `[project]` or `[tool.poetry]`; falls back to `[metadata].name` in `setup.cfg` |
   | java | `pom.xml` | `<artifactId>`; falls back to `rootProject.name` in `settings.gradle` |
   | go | `go.mod` | last path segment of `module` directive |

2. **Directory name** — when no manifest present or name field empty; lowercased and kebab-cased.

```
./api  (package.json "name": "payments-api")    → id: payments-api
./web  (package.json "name": "customer-portal") → id: customer-portal
./svc  (no package.json)                         → id: svc
```

If two services resolve to same ID, append project type: `payments-api-functions`, `payments-api-app-service`.

---

## Emulator Deduplication

1. Collect emulator lists from all service contexts
2. Deduplicate by name — each emulator appears once in `docker-compose.yml` regardless of how many services need it
3. Tag each emulator with dependent service IDs — used during connection string injection in generate

```yaml
sharedEmulators:
  - { name: azurite,  usedBy: [api, web] }
  - { name: cosmosdb, usedBy: [api] }
```

> Deduplication only affects compose output. Connection string injection still targets each service's own config file independently.

---

## Workspace Root

Nearest common ancestor directory of all service roots. Shared artifacts written here:

- `docker-compose.yml`
- `emulators:start` / `emulators:stop` scripts
- IDE compound debug configuration (see [ide/{ide}.md](ide/))

---

## Port Assignment

When 2+ services share same runtime, each needs unique debug port. Look up `Base debug port` from `runtimes/{rt}.md` and assign sequentially: first service gets base port, second base + 1, third base + 2, etc.

> Browser-based project types (e.g., Frontend SPA) skip debug ports — connect via dev server URL instead.

---

## Partial Configuration Handling

Check each service root for existing IDE debug config before generating. Service is already configured if it has debug configuration entry matching its service ID. See active IDE adapter in [ide/](ide/) for detection and merge rules.

| State | Action |
|-------|--------|
| **Fully configured service** | Skip all artifact generation; carry existing config into compound unchanged |
| **Partially configured service** | Generate only missing pieces (e.g. tasks but no debug config → generate debug config only) |
| **Unconfigured service** | Generate all artifacts as normal |

Adding second service to existing single-service repo is safe — original config preserved, new service added alongside.

---

## Output

Enriched workspace context passed to `inventory.md`:

```yaml
workspace:
  root: ./
  sharedEmulators:
    - { name: azurite,  usedBy: [api, web] }
    - { name: cosmosdb, usedBy: [api] }

services:
  - { id: api, root: ./api, projectType: functions,   runtime: node-ts }
  - { id: web, root: ./web, projectType: app-service,  runtime: node-ts }
```

---

## Compound Debug Configuration

> ⛔ **MANDATORY:** When 2+ service roots detected (including Frontend SPA projects), compound debug configuration **must** be generated. Frontend SPA counts as service root — no emulators needed, but needs debug config entry and inclusion in compound.

Compound uses service IDs from this phase. One entry per service using its assigned ID.

> ⚠️ Compound references shared "Start Emulators" task/step only when emulators required. Omit when no emulators needed.

See active IDE adapter in [ide/](ide/) for IDE-specific compound format. See [project-types/frontend-spa.md](project-types/frontend-spa.md) for SPA-specific debug config, dev-server task, and framework detection rules.
