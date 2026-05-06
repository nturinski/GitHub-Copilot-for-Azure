# {Type} — Project Type

> **Template** — Copy to `project-types/{type}.md` for new project type.

---

## Detection Signals

<!-- Files/packages/patterns identifying this project type. Used by classify.md. -->

| Signal | Notes |
|--------|-------|
| `{file}` | {description} |

---

## Dependency Discovery

<!-- How Azure service deps found: bindings, SDK scan, framework conventions. Maps to emulators/{name}.md. -->

| Dependency Signal | Azure Service | Emulator |
|------------------|---------------|---------|
| `{signal}` | {service} | [{name}](../emulators/{name}.md) |

---

## Startup Command

<!-- Local start command, e.g.: func host start, docker compose up, npm run dev -->

```
{command}
```

---

## Connection String Injection

<!-- Where emulator conn strings go: local.settings.json, .env, compose env vars -->

| Emulator | Variable | File |
|----------|----------|------|
| {emulator} | `{VAR_NAME}` | `{file}` |

---

## Runtime Support Matrix

<!-- Readiness per runtime: ✅ Full, ⚠️ Emulators only, 🔲 Planned. -->

| Runtime | Status | Reference |
|---------|--------|-----------|
| node-ts | | |
| node-js | | |
| dotnet  | | |
| python  | | |
| java    | | |
| go      | | |

---

## Runtime Wiring

<!-- Combines w/ runtimes/{rt}.md (protocol, port) + ide/{ide}.md → IDE debug config. VS Code: Startup command → tasks.json "command", Startup task label → tasks.json "label" + launch.json "preLaunchTask", Request Mode → launch.json "request". -->

| Runtime | Startup command | Startup task label | Request Mode | Notes |
|---------|----------------|-------------------|--------------|-------|
| node-ts | {command} | {label} | {attach\|launch} | |
| node-js | {command} | {label} | {attach\|launch} | |
| dotnet  | {command} | {label} | {attach\|launch} | |
| python  | {command} | {label} | {attach\|launch} | |
| java    | {command} | {label} | {attach\|launch} | |
| go      | {command} | {label} | {attach\|launch} | |
