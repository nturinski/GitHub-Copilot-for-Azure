# Classify Workspace

Determine project type(s) and runtime(s) to select correct scanning rules, emulator mappings, and launch configs.

> **Always scan full directory tree** — not workspace root only. Service roots in subdirectories (e.g. `./api/`, `./web/`) must be found regardless of layout.

---

## ⛔ MANDATORY: Run Classification Before Anything Else

Run detection tables below **in order** (first match wins per root). Classification produces array of service contexts — even single-service workspaces produce one-item services list so rest of flow is uniform.

---

## Step 0: Check for Project Plan (Optional Context)

Before scanning for service roots, check for `.azure/project-plan.md` in workspace root. **Not required** — skip silently if absent.

> Treat project plan as **advisory context**, not substitute for detection. Always run full detection tables — use plan to resolve ambiguity, validate findings, avoid misclassification.

---

## Step 1: Detect Project Types

Scan every subdirectory for these signals. Ignore: `node_modules/`, `.git/`, `dist/`, `build/`, `bin/`, `obj/`.

### Project Type Detection Table


| # | Detection Signals | Project Type | Status | Reference |
|---|-------------------|-------------|--------|-----------|
| 1 | `host.json` exists and Azure Functions SDK in dependencies | **Azure Functions** | ✅ Implemented | [project-types/functions.md](project-types/functions.md) |
| 2 | `Dockerfile` exists | **Container App** | 🔲 Planned | [limited-support.md](limited-support.md) |
| 3 | Web framework detected (Express/Fastify/ASP.NET/FastAPI/Flask/Spring) **AND** no `host.json` **AND** no `Dockerfile` | **App Service** | 🔲 Planned | [limited-support.md](limited-support.md) |
| 4 | `.AppHost.csproj` or `Aspire.Hosting` package in `*.csproj` | **.NET Aspire** | 🔲 Planned | [limited-support.md](limited-support.md) |
| 5 | SPA framework detected (React/Vue/Angular/Svelte via `package.json`) **OR** `vite.config.*` / `next.config.*` / `angular.json` present **AND** no `host.json` | **Frontend SPA** | ✅ Implemented | [project-types/frontend-spa.md](project-types/frontend-spa.md) |
| ∞ | No match | **Unknown** | — | [limited-support.md](limited-support.md) |

> **Frontend SPA projects** may not need emulators or Azure bindings, but **are** service roots. They contribute browser debug config and dev-server task. When frontend detected alongside backend, workspace is multi-service and **must** produce compound debug config. See active IDE adapter in [ide/](ide/) for IDE-specific format.


---

## Step 2: Detect Runtimes

After identifying project type per root, determine language and runtime version for each service root.

### Runtime Detection Table

| # | Detection Signals | Runtime | Version Source | Status | Reference |
|---|-------------------|---------|---------------|--------|-----------|
| 1 | `package.json` (+ `tsconfig.json`) | **node-ts** | `engines.node` / `.nvmrc` / `.node-version` | ✅ Implemented | [runtimes/node.md](runtimes/node.md) |
| 2 | `package.json` (no TypeScript) | **node-js** | Same | ✅ Implemented | [runtimes/node.md](runtimes/node.md) |
| 3 | `*.csproj` | **dotnet** | `<TargetFramework>` element | 🔲 Planned | [limited-support.md](limited-support.md) |
| 4 | `requirements.txt` / `pyproject.toml` | **python** | `.python-version` / `requires-python` | 🔲 Planned | [limited-support.md](limited-support.md) |
| 5 | `pom.xml` / `build.gradle` | **java** | `<java.version>` / `sourceCompatibility` | 🔲 Planned | [limited-support.md](limited-support.md) |
| 6 | `go.mod` | **go** | `go` directive | 🔲 Planned | [limited-support.md](limited-support.md) |
| ∞ | No match | **Unknown** | — | — | [limited-support.md](limited-support.md) |

---

## Step 3: Detect IDE (Workspace-Level)

Determine target IDE for workspace. IDE applies to entire workspace, not per-service. Priority:

1. **Explicit user request** — user names IDE in prompt (highest priority)
2. **Existing workspace artifacts** — check for IDE-specific files in workspace root
3. **Ask the user** — if no signal from prompt or workspace, use `ask_user` to ask target IDE

### ⛔ MUST: IDE Name Normalization

Normalize user's IDE reference to **canonical ID** using this table. These are **different products** — do NOT treat one as shorthand for another.

| User says | Canonical ID | Maps to | Reference |
|-----------|-------------|---------|-----------|
| "VS Code", "VSCode", "Visual Studio Code", "Code" | `vscode` | **VS Code** | [ide/vscode.md](ide/vscode.md) |
| "Visual Studio", "VS" (without "Code") | `visual-studio` | **Visual Studio** | [limited-support.md](limited-support.md) |
| Other | — | — | [limited-support.md](limited-support.md) |

> ⛔ **"Visual Studio" ≠ "VS Code".** Different IDEs. If user says "Visual Studio" or "VS", MUST classify as `visual-studio`, NOT `vscode`. Misclassifying IDE violates this rule.

After normalizing, check whether `references/ide/{canonical-id}.md` exists. If not, IDE has **limited support** — MUST follow [limited-support.md](limited-support.md) emission protocol before proceeding. Do NOT silently fall back to supported IDE.

---

## Step 4: Determine Single-Service vs Multi-Service

Count service roots found:

| Result | Next Step |
|--------|-----------|
| **1 service root** | Proceed directly to [inventory.md](inventory.md) |
| **2+ service roots** | Proceed to [multi-service.md](multi-service.md) first, then [inventory.md](inventory.md) |

---

## Output Format

Always produce workspace context with `ide` and `services[]` array (even for single-service):

**Single-service:**
```
workspace:
  ide: vscode
services:
  - { root: ./, projectType: functions, runtime: node-ts }
```

**Multi-service (monorepo):**
```
workspace:
  ide: vscode
services:
  - { root: ./api, projectType: functions,   runtime: node-ts }
  - { root: ./web, projectType: app-service,  runtime: node-ts }
```

Carry this context into next phase. Do NOT read `project-types/`, `runtimes/`, or `ide/` files here — classification only produces types, paths, and target IDE.
