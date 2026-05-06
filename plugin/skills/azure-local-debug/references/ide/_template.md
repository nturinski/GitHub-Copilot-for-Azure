# {IDE Name} — IDE Configuration

> **Template** — Copy to `ide/{ide}.md` for new IDE support.

---

## Overview

<!-- How this IDE handles debug/run configs. -->

## Configuration File Paths

| Purpose | File Path |
|---------|-----------|
| Debug configuration | `{path}` |
| Build configuration | `{path}` |

---

## Debug Configuration

<!-- How debugger connects to running app. VS Code: launch.json; JetBrains: Run/Debug Configuration. -->

Data sources:
- `runtimes/{rt}.md` → Debug protocol (map to IDE adapter ID), base debug port — server-side types
- `project-types/{type}.md` → Request Mode (attach/launch); browser-based types also provide debugger adapter type

### Template

<!-- Generic config shape w/ placeholder fields. -->

### Field Reference

<!-- Table: where each field value comes from. Include debugger adapter type rows — mapped from runtime debug protocol (server-side) or project type (browser-based, e.g., Frontend SPA → chrome). -->

### Example

<!-- Implemented examples. -->

---

## Build Configuration

<!-- How to build/start app. VS Code: tasks.json; JetBrains: Run Configurations or External Tools. -->

Data sources:
- `runtimes/{rt}.md` → Build chain commands (install, clean, watch, build)
- `project-types/{type}.md` → Startup command, startup task label, request mode
- This file → IDE-specific problem matchers

Two task kinds:
1. **Runtime build tasks** — install, clean, watch, build
2. **Project type top-level task** — starts app (e.g., `func host start`, `npm start`, `dotnet run`). Debug config pre-launch points here; top of dependency chain.

### Chain Shape

<!-- Dependency order diagram. -->

### Runtime Task Reference

<!-- Table w/ IDE-specific problem matchers (commands from runtimes). -->

### Per-Project-Type Subsections

> Add subsection only when project type needs IDE-specific task type or custom problem matcher (e.g., Azure Functions uses custom `func` task type in VS Code). Standard shell commands need no subsection — generic chain shape covers it.

### Example

<!-- Worked example for implemented runtime. -->

---

## Multi-Service / Compound Configuration

<!-- How this IDE runs multiple services simultaneously. -->

Data sources:
- [multi-service.md](../multi-service.md) → service IDs, port assignments, startup ordering

---

## Debug Configuration Checklist Validation

<!-- MANDATORY — Maps to Phase 3 of skill workflow. Execute every validation step. Do NOT skip or assume results. Do NOT proceed until every entry has ✅ or ❌. -->

---

## Quick Start

<!-- One-liner user instructions (e.g., "Press F5", "Click Run") -->
