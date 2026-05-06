# Node.js — Debug & Build Configuration

> Covers **JavaScript** and **TypeScript**. Debugger properties identical; only build chain differs.

## Prerequisites

| Tool | Detection Command | Required For | Install Link |
|------|-------------------|-------------|-------------|
| Node.js | `node --version` | All Node projects | [nodejs.org](https://nodejs.org/) |
| npm | `npm --version` | Dependency management | (bundled with Node) |

---

## Debugger Properties

Debug properties for this runtime. IDE adapter in [ide/{ide}.md](../ide/) uses these to generate IDE-specific debug config.

| Property | Value | Notes |
|----------|-------|-------|
| Debug protocol | `Node Inspector` | V8 inspector protocol over WebSocket. Each IDE maps to its own adapter — e.g., VS Code uses `"type": "node"`. |
| Base debug port | `9229` | Default Node.js inspector port |
| Auto-restart | `true` | Re-attach after host restarts on file changes |

> **Monorepo / multi-service:** Multiple Node services get sequential debug ports from base port in project type's Runtime Wiring table. See [multi-service.md](../multi-service.md) for port assignment rules.

---

## Variant Detection

| Signal | Variant | Notes |
|--------|---------|-------|
| `tsconfig.json` present | **node-ts** | TypeScript — requires compile step |
| `package.json` without `tsconfig.json` | **node-js** | Plain JavaScript — no compile step |

---

## Build Chain

Runtime owns: install, clean, build, watch. Startup task and dependency wiring come from project type's Runtime Wiring table — not this file.

### node-ts (TypeScript)

```
"{startup task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "watch step"
       │                └── dependsOn: "clean step"
       │                               └── dependsOn: "install step"
       └── dependsOn: "Start Emulators"
```

| Step | Command | Purpose | Background? |
|------|---------|---------|------------|
| install | `npm install` | Installs dependencies | No |
| clean | `npm run clean` | Cleans build output | No |
| watch | `npm run watch` | Runs `tsc --watch` for incremental builds | ✅ Yes |
| build | `npm run build` | One-shot build (used outside debug flow) | No |

### node-js (JavaScript)

```
"{startup task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "install step"
       └── dependsOn: "Start Emulators"
```

| Step | Command | Purpose | Background? |
|------|---------|---------|------------|
| install | `npm install` | Installs dependencies | No |

> No compile, clean, or watch step — JavaScript runs directly.

> **Monorepo / alternative package managers:** Adjust commands for `yarn`, `pnpm`, or monorepo layouts. Key invariant — chain shape: **install → [clean → build/watch →] startup task** (compile steps only for TypeScript).

See IDE adapter in [ide/{ide}.md](../ide/) for how build steps render into IDE-specific task config.

---

## Convenience Scripts

Add to `package.json` `"scripts"`:

```json
{
  "emulators:start": "docker compose down && docker compose up -d",
  "emulators:stop": "docker compose down",
  "emulators:clean": "docker compose down && rm -rf {data-dirs}"
}
```

> **`{data-dirs}`** — Space-separated list of `./.{name}` emulator data dirs from `docker-compose.yml`. Example: `.azurite .postgres`. Derive from actual `volumes:` mounts — do not hardcode. See [generate.md](../generate.md) for derivation rules.

When migrations detected, also add:

```json
{
  "db:migrate": "{migration tool CLI command}"
}
```

> `db:migrate` wraps detected migration tool CLI (e.g., `npx prisma migrate deploy`, `npx knex migrate:latest`). See [migrations.md](../migrations.md) for command determination.

| Script | Location | Run Command |
|--------|----------|-------------|
| `emulators:start` | `package.json` scripts | `npm run emulators:start` |
| `emulators:stop` | `package.json` scripts | `npm run emulators:stop` |
| `emulators:clean` | `package.json` scripts | `npm run emulators:clean` |
| `db:migrate` | `package.json` scripts | `npm run db:migrate` |
