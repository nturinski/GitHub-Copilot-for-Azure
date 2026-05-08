# VS Code — IDE Configuration

## Overview

VS Code uses two JSON files under `.vscode/` for debugging and build tasks.

## Configuration File Paths

| Purpose | File Path |
|---------|-----------|
| Debug configuration | `.vscode/launch.json` |
| Build configuration | `.vscode/tasks.json` |

---

## Debug Configuration — `launch.json`

Assembles `launch.json` entries by combining **debugger properties** from `runtimes/{rt}.md` (port) and **request mode** from `project-types/{type}.md` with VS Code wrapper below.

### Template

```json
{
  "name": "{service-id} (debug)",
  "type": "<vs-code-debugger-type>",
  "request": "<attach-or-launch>",
  "port": "<base-debug-port>",
  "restart": true,
  "preLaunchTask": "<startup-task-label>"
}
```

### Field Reference

| Field | Source | Notes |
|-------|--------|-------|
| `name` | Service ID from [multi-service.md](../multi-service.md) or project name | Suffixed with `(debug)` |
| `type` | **Server-side:** Debug protocol from `runtimes/{rt}.md` → mapped via runtime table below. **Browser-based:** Project type from `project-types/{type}.md` → mapped via project-type table below. | Depends on whether debugger attaches to runtime process or launches browser. |
| `request` | `project-types/{type}.md` → Runtime Wiring → `Request Mode` | `"attach"` when host command spawns runtime; `"launch"` when IDE starts it |
| `port` | `runtimes/{rt}.md` → `Base debug port` | Incremented per service in monorepos (see [multi-service.md § Port Assignment](../multi-service.md)). Not used for browser-based configs (use `url` instead). |
| `restart` | Always `true` | Re-attach after host restarts on file changes |
| `preLaunchTask` | `project-types/{type}.md` → startup task label | e.g. `"func: host start"` — rendered via per-project-type subsection in Build Configuration below |

### Runtime Debug Protocol → VS Code Adapter Mapping

> For server-side project types (Functions, App Service, etc.) attaching to runtime process.
>
> **To add new runtime:** add row here, then create/update corresponding `runtimes/{rt}.md` with debugger properties.

| Runtime | Debug Protocol → VS Code Debugger Type | Extra Fields | Status |
|---------|----------------------|--------------|--------|
| node | Node Inspector → `node` | — | ✅ Implemented |
| dotnet | CoreCLR DAP → `coreclr` | `"processId": "${command:pickProcess}"` | ⛔ Not yet implemented |
| python | debugpy DAP → `debugpy` | `"connect": { "host": "localhost", "port": 5678 }` | ⛔ Not yet implemented |
| java | JDWP → `java` | `"hostName": "localhost"` | ⛔ Not yet implemented |
| go | Delve DAP → `go` | `"mode": "remote"` | ⛔ Not yet implemented |

### Project-Type → VS Code Adapter Mapping

> For browser-based project types where IDE launches browser instead of attaching to runtime. Adapters determined by project type, not runtime.

| Project Type | VS Code Debugger Type | Extra Fields | Reference |
|-------------|----------------------|--------------|-----------|
| Frontend SPA | `chrome` | `"url"`, `"webRoot"` | [project-types/frontend-spa.md](../project-types/frontend-spa.md) |

### Example: Frontend SPA

> See [project-types/frontend-spa.md](../project-types/frontend-spa.md) for detection signals and framework table.

Debug adapter: `chrome` (built-in JS Debugger). Request mode: `launch` (VS Code opens browser).

```json
{
  "name": "{id} (debug)",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:{dev-server-port}",
  "webRoot": "${workspaceFolder}/{service-root}",
  "preLaunchTask": "{id} dev"
}
```

---

## Build Configuration — `tasks.json`

Tasks defined in `.vscode/tasks.json`. Builds dependency chain with two task kinds:

1. **Runtime build tasks** — install, clean, watch, build (commands from `runtimes/{rt}.md`, problem matchers from this file)
2. **Project type top-level task** — starts application (e.g., `func host start`). `preLaunchTask` points here. Sits atop chain, depends on runtime build tasks.

### Chain Shape

```
"<top-level-task>"                ← project-type-specific (see per-project-type subsections below)
       ├── dependsOn: "<watch-task>"       ← from Runtime Task Reference
       │                └── dependsOn: "<clean-task>"
       │                               └── dependsOn: "<install-task>"
       └── dependsOn: "Start Emulators"    ← only when emulators are required
```

### Emulator Task

Present only when emulators required (i.e., `docker-compose.yml` generated during Phase 1):

```json
{
  "type": "shell",
  "label": "Start Emulators",
  "command": "docker compose down && docker compose up -d",
  "problemMatcher": []
}
```

### Runtime Task Reference

> **To add new runtime:** add row here with VS Code problem matchers, then create/update corresponding `runtimes/{rt}.md` with build commands and chain shape.
>
> Build commands (install, clean, watch, build) **not** listed here — sourced from each `runtimes/{rt}.md` Build Chain section.

| Runtime | Watch Problem Matcher | Build Problem Matcher | Status |
|---------|----------------------|----------------------|--------|
| node-ts | `$tsc-watch` | `$tsc` | ✅ Implemented |
| node-js | — | — | ✅ Implemented |
| dotnet | `$msCompile` | `$msCompile` | ⛔ Not yet implemented |
| python | — | — | ⛔ Not yet implemented |
| java | — | — | ⛔ Not yet implemented |
| go | — | — | ⛔ Not yet implemented |

> **Monorepo / alt package managers:** Adjust labels/commands as needed (e.g., `yarn`, `pnpm`, `gradle`). Key invariant: **install → clean → build/watch → top-level task**. Some runtimes skip clean or watch — use only what applies.

### Working Directory (`cwd`) Rules

> ⚠️ **CRITICAL for multi-service repos.** Without correct `cwd`, commands like `npm install` or `func host start` run from workspace root and fail.

| Task Scope | `cwd` Setting | Example |
|------------|--------------|---------|
| **Per-service tasks** (install, clean, watch, build, top-level) | `"options": { "cwd": "${workspaceFolder}/{service-root}" }` | `"cwd": "${workspaceFolder}/api"` |
| **Shared tasks** (Start Emulators) | Workspace root (omit `cwd` — defaults to workspace root) | — |
| **Single-service repos** | Omit `cwd` — workspace root is service root | — |

### Per Project Type: Azure Functions

> See [project-types/functions.md](../project-types/functions.md) for startup command, request mode, per-runtime notes. Covers VS Code-specific rendering only. Standard `"type": "shell"` project types need no subsection — generic chain shape above covers them.

Top-level task uses VS Code `func` task type from Azure Functions extension. `preLaunchTask` points to this task.

| Runtime | Task Type | Problem Matcher | Status |
|---------|-----------|----------------|--------|
| node-ts | `func` | `$func-node-watch` | ✅ Implemented |
| node-js | `func` | `$func-node-watch` | ✅ Implemented |
| dotnet  | `func` | `$func-dotnet-watch` | ⛔ Not yet implemented |
| python  | `func` | `$func-python-watch` | ⛔ Not yet implemented |
| java    | `func` | `$func-java-watch` | ⛔ Not yet implemented |

**node-ts** (has watch task):

```json
{
  "type": "func",
  "label": "func: host start",
  "command": "host start",
  "problemMatcher": "$func-node-watch",
  "isBackground": true,
  "dependsOn": ["npm watch", "Start Emulators"]
}
```

**node-js** (no compile/watch step):

```json
{
  "type": "func",
  "label": "func: host start",
  "command": "host start",
  "problemMatcher": "$func-node-watch",
  "isBackground": true,
  "dependsOn": ["npm install", "Start Emulators"]
}
```

> `dependsOn`: first entry = runtime-specific prerequisite — watch task for TypeScript, install task for JavaScript. Include `"Start Emulators"` only when emulators required.

### Example: frontend SPA tasks

> See [project-types/frontend-spa.md](../project-types/frontend-spa.md) for detection signals, framework table, startup task label derivation.

Top-level task = framework dev server (e.g., `npm run dev` for Vite). No runtime build chain — dev server handles everything. Task label pattern: `"{id} dev"` (see [project-types/frontend-spa.md](../project-types/frontend-spa.md) Runtime Wiring).

```json
{
  "type": "shell",
  "label": "{id} dev",
  "command": "npm run dev",
  "options": { "cwd": "${workspaceFolder}/{service-root}" },
  "isBackground": true,
  "problemMatcher": {
    "owner": "vite",
    "pattern": { "regexp": "^$" },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "VITE",
      "endsPattern": "ready in \\d+"
    }
  }
}
```

> ⚠️ **IMPORTANT: Background tasks MUST have real `problemMatcher`.**
> Avoid `"problemMatcher": []` on task with `"isBackground": true`.
> Empty matcher causes VS Code blocking dialog: *"The task has not exited and doesn't have a 'problemMatcher' defined."*
> Use framework-specific background matcher from [project-types/frontend-spa.md](../project-types/frontend-spa.md).

---

## Multi-Service / Compound Configuration

> ⛔ **MANDATORY:** When 2+ service roots detected (including Frontend SPA projects), compound launch configuration **must** be generated.

```json
{
  "name": "Start All",
  "configurations": ["{id} (debug)", "..."],
  "preLaunchTask": "Start Emulators",
  "stopAll": true
}
```

One entry per service using assigned ID from [multi-service.md](../multi-service.md).

> ⚠️ `preLaunchTask` **conditional**: include `"preLaunchTask": "Start Emulators"` only when emulators required (i.e., `"Start Emulators"` task exists in `tasks.json`). Omit field entirely when no emulators needed.

---

## Debug Configuration Checklist Validation

> ⛔ **MANDATORY — THIS IS THE MOST IMPORTANT STEP.** You must execute real commands in the terminal for each launch config. "Validation" does NOT mean checking that files exist or that JSON is valid. It means actually starting the server process, observing stdout output, and curling the HTTP endpoint.
>
> ⚠️ **Common failure mode:** Agents often skip this step or fake results by writing "✅ READY" or "✅ VALIDATED" without running anything. This is the #1 cause of test failures. You MUST run real terminal commands.

For each **non-compound** launch configuration in `.vscode/launch.json`:

1. Read config's `preLaunchTask` value
2. Trace full `dependsOn` chain in `.vscode/tasks.json` to resolve dependency order
3. Run prerequisite tasks first (install, clean, emulators), then start `preLaunchTask` as background process
4. If `docker-compose.yml` generated, verify all services started after `docker compose up -d`. Long-running services (e.g., database emulators, Azurite) should be running/healthy; one-shot services (e.g., `db-migrate`) should exit code 0. Use `docker compose ps` and `docker compose logs <service>` to check. If any failed, diagnose, fix, re-run until healthy/exited cleanly. Mark ❌ only after exhausting reasonable fix attempts.
5. Confirm ready signal in stdout from **top-level task**:
   - Azure Functions host → `"Host lock lease acquired"` or `"Functions host started"`
   - Vite / webpack → `"ready in"` or `"Local:"`
   - Node HTTP server → `"listening on"` or `"Server running"`
6. After ready signal, confirm with `curl` using **application HTTP port** (not debug port):
   - `node`-type configs (Functions): `curl -s -o /dev/null -w "%{http_code}" http://localhost:7071/api/health` → expect `200` (port `7071` = Functions host HTTP port; debug port `9229` = debugger only)
   - `chrome`-type configs (browser dev servers): `curl -s -o /dev/null -w "%{http_code}" http://localhost:<url port from launch config>` → expect `200` or `301`
   - **Note:** For `chrome`-type configs, validating dev server started and is reachable — no browser launch needed. `preLaunchTask` is shell task (`npm run dev` / Vite) running in terminal.
7. Kill background processes, move to next config
8. Compound configs: skip running; mark ✅ if all named member configs passed, ❌ if any failed

**Edit `## Debug Configuration Checklist` section in `.azure/local-development-plan.md`:**

> ⚠️ **FORMAT IS CRITICAL — use plain text, NOT markdown tables.** Each line must start with ✅ or ❌ at column 0. Do NOT use `| column |` table syntax.

```
✅ <config-name> — <ready signal observed> + curl <status code>
❌ <config-name> — <failure description>
```

One line per config (non-compound and compound). ✅ requires ready signal observed AND curl confirmed. Replace every `⬜ PENDING` stub — any remaining stubs mean validation is incomplete.

> ⛔ Do NOT set status to `Implemented` until every `⬜ PENDING` stub in Debug Configuration Checklist replaced with real ✅ or ❌. Remaining stubs = incomplete — go back and validate.
> 
> 🛑 **SELF-CHECK before proceeding:** Count the `⬜ PENDING` entries remaining. If count > 0, you are not done. Execute the missing validations now.

---

## Quick Start

After Phase 3 validation, include in closing message:

> Press **F5** in VS Code and select **Start All** to launch full application with debugging.
