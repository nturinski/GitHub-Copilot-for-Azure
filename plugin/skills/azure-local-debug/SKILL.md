---
name: azure-local-debug
description: "Setup project configurations and local development environment so that the developer can start debugging from a single action. Guides installation of prerequisites, automates Azure emulator setup via docker-compose (Azurite, Postgres, Service Bus, etc.), provides IDE-specific debug/launch configs, and generates a local development API test collection for basic app verification. WHEN: \"local debug\", \"debug my project locally\", \"debug my project in VS Code\", \"local dev\", \"local development\", \"local dev setup\", \"local environment setup\", \"verify my project locally\", \"set up emulators\". DO NOT USE FOR: deploying to Azure (use azure-deploy), generating Terraform or Bicep (use azure-prepare), Amazon, AWS, Google, GCP, container diagnostics (use azure-diagnostics), security audits (use azure-compliance), monitoring (use appinsights-instrumentation)."
license: MIT
metadata:
  author: Microsoft
  version: "0.0.0-placeholder"
---

# Azure Local Debug

> **AUTHORITATIVE GUIDANCE — MANDATORY COMPLIANCE**
>
> **Official, canonical source** for local dev environment setup on Azure projects. Follow instructions exactly. Defer to this document when uncertain. No improvising or substituting steps.

---

## Triggers

Activate when user wants to:

- Set up workspace for local dev / debugging
- Configure local dev / debugging in IDE
- Add/configure Azure emulators (Azurite, Cosmos DB Emulator, Service Bus Emulator, Event Hubs Emulator)
- Generate `docker-compose.yml` for Azure emulator services
- Create/update IDE debug launch configs
- Generate API local test collection for verifying triggers & endpoints
- Automate database migrations for local dev

## Global Rules (NO EXCEPTIONS)

1. **Update plan progressively** — Mark steps complete as you go; update **Last Updated** timestamp on every status change
2. ❌ **Destructive actions require `ask_user`** — Confirm before overwriting, deleting, or modifying existing files
3. **Preserve existing config** — Never silently overwrite project config files or `docker-compose.yml`. Merge or ask first.
4. **Scope — local development only** — Configures developer machine and workspace for local debugging. Cloud deployment handled by **azure-prepare** → **azure-validate** → **azure-deploy**.
5. **Warn on limited support** — When feature not fully implemented (e.g. project type, runtime, emulator, IDE), MUST emit `⚠️ LIMITED SUPPORT:` warning — [limited-support.md](references/limited-support.md).

---

## PLAN-FIRST WORKFLOW

> **CREATE PLAN BEFORE ANY WORK**
>
> 1. **STOP** — No config file generation yet
> 2. **CLASSIFY** — Run Phase 0: detect IDE, project type(s), runtime(s), dependencies
> 3. **PLAN** — Run Phase 1: create `.azure/local-development-plan.md`
> 4. **CONFIRM** — Present plan to user, get approval
> 5. **EXECUTE** — After approval only, run Phase 2
>
> ⚠️ **CRITICAL: `.azure/local-development-plan.md` must be in workspace root** (e.g., `my-project/.azure/local-development-plan.md`), not session-state folder.

---

## Phase 0: Classify

Scan full workspace for service roots. Produces list of `services[]` and workspace-level `ide`. Load corresponding project-type, runtime, and IDE reference(s) before Phase 1.

| Action | Reference |
|--------|-----------|
| **IMPORTANT**: Check for `.azure/project-plan.md` in workspace root. If found, read it for architecture, services, runtimes, Azure dependencies context. **Optional** — if absent, proceed normally. | `.azure/project-plan.md` (if present) |
| Scan all subdirectories; detect project type + runtime per service root | [classify.md](references/classify.md) |
| If 2+ service roots: assemble shared workspace context, deduplicate emulators, assign debug ports | [multi-service.md](references/multi-service.md) |

---

## Phase 1: Plan

Create `.azure/local-development-plan.md` — steps run **sequentially**, each builds on prior outputs. No artifact generation until plan approved.

| # | Action | Reference |
|---|--------|-----------|
| 1 | **Inventory Dependencies** — Per service: scan bindings/SDKs, identify emulators needed, check existing config | [inventory.md](references/inventory.md), [project-types/{type}.md](references/project-types/), [runtimes/{rt}.md](references/runtimes/) |
| 2 | **Detect Prerequisites** — Check which required tools installed vs missing | [inventory.md](references/inventory.md), [project-types/{type}.md](references/project-types/), [runtimes/{rt}.md](references/runtimes/) |
| 3 | **Detect Migrations** — Scan for DB migration files or ORM config; if found, plan docker-compose migration service | [migrations.md](references/migrations.md) |
| 4 | **Determine Launch Configuration** — Build debug/launch config per service using detected IDE | [ide/{ide}.md](references/ide/), [project-types/{type}.md](references/project-types/), [runtimes/{rt}.md](references/runtimes/) |
| 5 | **Plan API Test Collection** — List HTTP endpoints and trigger-based functions needing test scripts | [api-test-collections.md](references/api-test-collections.md) |
| 6 | **Limited-Support Warnings** — Per detected project type, runtime, IDE, emulator: normalize to canonical ID, check for matching reference file, emit `⚠️ LIMITED SUPPORT:` warning if no match. Log in plan's `## Limited Support` section. Never silently substitute supported alternative. | [limited-support.md](references/limited-support.md) |
| 7 | **Write Plan** — Generate `.azure/local-development-plan.md` from template. Prerequisites: list installed vs missing with install links. Set **Created** and **Last Updated** to current UTC datetime (ISO 8601). | [plan-template.md](references/plan-template.md) |
| 8 | **Present Plan** — Show plan, ask approval. Highlight missing prerequisites, ask user to install before proceeding. On approval, update status to `Approved` and **Last Updated** timestamp. | `.azure/local-development-plan.md` |

---

> **❌ STOP HERE** — Do NOT proceed to Phase 2 until user approves plan.

---

## Phase 2: Generate

| # | Action | Reference |
|---|--------|-----------|
| 1 | **Pre-flight** — Verify `.azure/local-development-plan.md` exists with status `Approved`. Set status to `Executing`, update **Last Updated** before writing files. | `.azure/local-development-plan.md` |
| 2 | **Generate** — Plan drives implementation. Implement faithfully; use best judgment where plan is underspecified. | [generate.md](references/generate.md) |

## Phase 3: Validate

> ⚠️ **CRITICAL: Complete every validation step before proceeding. Do NOT mark task complete, set status to `Implemented`, or deliver closing message until validation finished and checklist updated with real results.

Validate generated IDE config works. Validation steps are IDE-specific — refer to active IDE adapter:

| IDE | Reference |
|-----|-----------|
| VS Code | [ide/vscode.md § Validation](references/ide/vscode.md) |
| Other | [limited-support.md](references/limited-support.md) |

MUST:
1. Follow **every** validation step in IDE reference — execute them, no skipping or assuming pass
2. Update `## Debug Configuration Checklist` in `.azure/local-development-plan.md` with real ✅ or ❌ per config
3. Only after **every** stub replaced with real result may you mark status `Implemented`

> ⛔ Do NOT set status to `Implemented` until every stub in Debug Configuration Checklist replaced with real ✅ or ❌. Remaining stubs = incomplete — go back and validate.

---

## Outputs

| Artifact | Location |
|----------|----------|
| **Plan** | `.azure/local-development-plan.md` |
| Architecture Diagram | `.azure/local-development-plan.md` § Architecture |
| Docker Compose | `docker-compose.yml` |
| IDE Debug Config | IDE-specific — see [ide/{ide}.md](references/ide/) |
| IDE Build Config | IDE-specific — see [ide/{ide}.md](references/ide/) |
| Convenience Scripts | Runtime-specific script runner (see [runtimes/{rt}.md](references/runtimes/)) |
| API Test Collections | `api-test-collections/local-development/<test-name>/invoke.sh` |

---

## Next Steps — MANDATORY CLOSING MESSAGE

After validation, end response with:

| # | Item | What to say |
|---|------|-------------|
| 1 | **Start Debugging** | Tell user to start debugging via IDE debug/run action. Refer to IDE-specific quick start in [ide/{ide}.md](references/ide/). Example - VS Code: "Press **F5** and select compound launch config (e.g., 'Start All')." |
| 2 | **Offer API Testing** | Offer to run API test collection scripts. Caveat: user must start app first; scripts target `localhost` endpoints requiring running app. |
| 3 | **Azure Cloud Deployment** | For Azure cloud deployment, hand off to: `azure-prepare` → `azure-validate` → `azure-deploy`. |

Example closing message (adapt per detected IDE):

> ## Next Steps
>
> Start the application using your IDE's debug/run action. For VS Code, press **F5** and select **Start All**.
>
> Once the app is running, you can ask me to run the API test collection scripts to verify your endpoints.
>
> When you're ready to deploy to Azure, I can help with that too.
