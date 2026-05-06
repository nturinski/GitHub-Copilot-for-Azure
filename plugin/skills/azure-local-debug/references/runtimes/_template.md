# {Runtime} — Debug & Build Configuration

> **Template** — Copy to `runtimes/{rt}.md` for new runtime.

---

## Prerequisites

<!-- Required tools, SDKs, version managers — language toolchain only. No project-type-specific tools (e.g., Functions Core Tools → functions.md). -->

| Tool | Detection Command | Install Link |
|------|-------------------|-------------|
| `{tool}` | `{tool} --version` | [link]() |

---

## Debugger Properties

<!-- Generic debug props. IDE adapter in ide/{ide}.md uses these for debug config. See project-types/{type}.md § Runtime Wiring for host command combination. -->

| Property | Value | Notes |
|----------|-------|-------|
| Debug protocol | `{protocol}` | Wire protocol runtime exposes (e.g., `Node Inspector`, `CoreCLR DAP`, `debugpy DAP`, `JDWP`, `Delve DAP`). Each IDE adapter maps to its debugger ID — see `ide/{ide}.md`. |
| Base debug port | `{port}` | Default debug port; overridden per-service in monorepos |

---

## Build Chain

<!-- Build steps owned by this runtime: install, build/watch. Startup task from project type's Runtime Wiring table. Wire: startup task dependsOn ["build/watch step", "Start Emulators"]. -->

Chain shape (startup task from project type):

```
"{startup task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "{build/watch step}"  ← this file
       └── dependsOn: "Start Emulators"     ← only when emulators are required
```

### Build Commands

| Step | Command | Purpose | Background? |
|------|---------|---------|------------|
| Start Emulators | `docker compose down && docker compose up -d` | Start all emulator services | No |

See IDE adapter in [ide/{ide}.md](../ide/) for how build steps render into IDE-specific task config.

---

## Convenience Scripts

<!-- Script registry (package.json, Makefile, pyproject.toml) and standard names: emulators:start, emulators:stop, db:migrate -->

| Script | Location | Run Command |
|--------|----------|-------------|
| `emulators:start` | `{file}` | `{command}` |
| `emulators:stop` | `{file}` | `{command}` |
| `emulators:clean` | `{file}` | `{command}` |
| `db:migrate` | `{file}` | `{command}` |
