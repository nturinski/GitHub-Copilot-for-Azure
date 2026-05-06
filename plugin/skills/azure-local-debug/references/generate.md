# Artifact Generation

Generate local dev config files from approved plan.

---

## ⛔ CRITICAL: Plan Must Be Approved First

**Do NOT generate files until `.azure/local-development-plan.md` exists and user approved it.** Plan = source of truth — generate exactly what it specifies.

---

## Pre-Generation Checks

Verify before generating:

1. ✅ Plan exists at `.azure/local-development-plan.md` with status `Approved` or `Executing`
2. ✅ Project type, IDE, runtime detected (from [classify.md](classify.md))
3. ✅ Inventory results documented in plan (from [inventory.md](inventory.md))
4. ✅ No existing file silently overwritten

---

## Stale Data Directory Pre-Flight

Check for leftover emulator data dirs from prior run (e.g. `.postgres/`, `.azurite/`, `.cosmos/`, `.servicebus/`). These cause container startup failures — PostgreSQL `initdb` refuses to initialize if `/var/lib/postgresql/data` (mounted from `.postgres/`) contains files from incompatible/partial cluster.

If stale dirs found:

1. **List all found dirs** with sizes.
2. **Ask user** via `ask_user`:

```
ask_user(
  question: "The following emulator data directories were found from a previous run:\n\n- .postgres/ (45 MB)\n- .azurite/ (12 MB)\n\nThese can cause container startup failures. How would you like to handle this?",
  choices: [
    "Delete them and start fresh (recommended)",
    "Keep them — I want to preserve the existing data"
  ]
)
```

3. **User chooses delete** — `rm -rf` dirs before proceeding.
4. **User keeps them** — Proceed, warn containers may fail. Offer cleanup if they do.
5. **Never delete data dirs silently** — Always confirm first.

> Especially important when workspace freshly scaffolded from new `.azure/project-plan.md` but contains stale data from prior run.

---

## Port Conflict Pre-Flight

Scan all ports needed by planned emulators (e.g. `lsof -i -P -n`). For each occupied port, identify process name and PID.

If conflicts found:

1. **List all conflicts** — port number, process name, PID.
2. **Ask user** via `ask_user`:

```
ask_user(
  question: "The following ports are already in use on your machine:\n\n- Port 5432 → postgres (PID 1234)\n\nThese ports are needed by the planned emulators. How would you like to handle this?",
  choices: [
    "Help me remap the conflicting ports to alternatives",
    "I'll handle it myself — proceed with the plan as-is"
  ]
)
```

3. **User wants remapping** — Propose alternative ports, update all references (docker-compose service ports, connection strings, convenience scripts, IDE debug config), then resume.
4. **User handles it** — Proceed with original ports. They resolve conflicts before `docker compose up`.
5. **Never remap ports or modify config silently** — Always confirm first.

### Reactive (When Containers Fail at Runtime)

If containers fail after generation — or user reports unhealthy container / docker compose errors — re-run port scan, follow same protocol above.
