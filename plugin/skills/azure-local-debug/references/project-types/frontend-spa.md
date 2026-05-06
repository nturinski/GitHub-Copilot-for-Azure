# Project Type: Frontend SPA

Local dev setup ref for frontend SPA projects.

---

## Detection Signals

| Signal | Notes |
|--------|-------|
| `vite.config.*` or `vite` in devDependencies | Vite-based SPA |
| `next.config.*` or `next` in dependencies | Next.js app |
| `angular.json` | Angular app |
| `react-scripts` in dependencies | Create React App |

---

## Runtime Support Matrix

| Runtime | Status | Reference |
|---------|--------|-----------|
| node | ✅ Full | [runtimes/node.md](../runtimes/node.md) |

---

## Dependency Discovery

Frontend SPAs talk to backends via HTTP in local dev — no direct Azure emulator connections. In monorepos, Azure service deps (storage, databases, etc.) handled by backend project type. In standalone SPA projects, backend runs as deployed service or separate local process — no emulator setup needed for SPA.

---

## Startup Command

Startup command = framework dev server:

| Framework | Default Command | Default Dev Port |
|-----------|---------|-----------------|
| Vite | `npm run dev` | 5173 |
| Next.js | `npm run dev` | 3000 |
| Angular | `npm start` or `ng serve` | 4200 |
| Create React App | `npm start` | 3000 |

---

## Runtime Wiring

<!-- Combines with runtimes/{rt}.md (protocol, port) and ide/{ide}.md to produce IDE debug config.
     Debug port values from runtimes/{rt}.md do not apply here — the browser debugger connects via the dev server URL. -->

| Runtime | Startup command | Startup task label | Request Mode | Notes |
|---------|----------------|-------------------|--------------|-------|
| node | `npm run dev` | `{id} dev` | `launch` | IDE launches browser; dev server is prerequisite task |

---

## Framework Detection & Problem Matchers

Each framework emits different console output when dev server ready. Patterns used for background problem matchers in IDE build config.

| Framework | Detection | Ready Pattern (begins) | Ready Pattern (ends) |
|-----------|----------|----------------------|---------------------|
| Vite | `vite.config.*` or `vite` in devDependencies | `VITE` | `ready in \d+` |
| Next.js | `next.config.*` or `next` in dependencies | `\s*ready` | `started server on` |
| Angular | `angular.json` | `Compiling` | `Compiled successfully` |
| Create React App | `react-scripts` in dependencies | `Starting the development server` | `Compiled` |

> All background problem matchers must include `"activeOnStart": true` and no-op error pattern (`"regexp": "^$"`). `owner` field = framework name (lowercased).
