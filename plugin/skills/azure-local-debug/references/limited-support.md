# Limited Support Warnings

> Emit standardized warning when skill detects feature not fully implemented. Format consistent across all categories.

---

## ⛔ Detection Algorithm — MANDATORY

For every detected project type, runtime, IDE, emulator, follow **exactly**:

1. **Check for match** — List files in category folder (ignore `_template.md`). If any filename loosely matches detected value (ignore case, spaces, dashes, underscores), feature is supported.
2. **Match exists** → fully supported. Proceed normally.
3. **No match** → limited support. **MUST** emit warning. Do NOT substitute different supported feature.

| Category | Category Folder |
|----------|-----------------|
| Project type | `references/project-types/` |
| Runtime | `references/runtimes/` |
| IDE | `references/ide/` |
| Emulator | `references/emulators/` |

> ⚠️ **Do NOT skip this check.** Every detected feature MUST be verified against category folder. If unsure, list files to confirm.

---

## Warning Format

```
⚠️ LIMITED SUPPORT: {Category} "{value}" is not yet fully supported.
```

Where:
- `{Category}` — short label for feature area (e.g., `Project type`, `Runtime`, `Emulator`, `IDE`)
- `{value}` — specific feature detected (e.g., `python`, `Container App`, `Cosmos DB`, `Visual Studio`)

---

## ⛔ Emission Protocol — MANDATORY

When limited-support feature detected, **MUST** follow this exact sequence:

### Step 1: Emit in assistant message

Write canonical warning in **regular assistant message text**. Mandatory — warning must be visible in chat output, not hidden in tool call.

```
⚠️ LIMITED SUPPORT: Emulator "Durable Task Scheduler" is not yet fully supported.
```

### Step 2: Confirm with user

For **first** limited-support feature in session, call `ask_user` to confirm:

```
ask_user(
  question: "⚠️ LIMITED SUPPORT: {Category} \"{value}\" is not yet fully supported. Would you still like me to put forth a best-effort attempt?",
  choices: [
    "Yes, proceed with best effort",
    "No, stop here"
  ]
)
```

If user agrees, treat as blanket consent for rest of session. Later limited-support features still emit `⚠️ LIMITED SUPPORT:` warning in assistant message — but do **not** call `ask_user` again.

### Step 3: Record in plan

Add item to `## Limited Support` section in `.azure/local-development-plan.md`. See [Plan Integration](#plan-integration).

> Emit each `⚠️ LIMITED SUPPORT:` warning exactly once per `(Category, value)` pair in assistant messages. 

---

## No Silent Substitution

**Do NOT silently substitute supported alternative** when feature has limited support (e.g. switching Container App to Azure Functions, Python to Node.js, Visual Studio to VS Code). Always plan for project type, runtime, IDE, emulators user requested, even when support is limited.

---

## Plan Integration

When **any** limited-support items exist, `## Limited Support` section in `.azure/local-development-plan.md` is **mandatory**. Add every limited-support item for user review before plan approval.

---

## Example

User prompt: *"Set up this app for debugging with JetBrains."*

1. Classify IDE → canonical ID: `jetbrains`
2. Check: does `references/ide/jetbrains.md` exist? **No** → limited support
3. Emit in assistant message:
   ```
   ⚠️ LIMITED SUPPORT: IDE "JetBrains" is not yet fully supported.
   ```
4. Call `ask_user` to confirm (first occurrence)
5. Add to plan `## Limited Support` section:

   | Category | Value | Impact |
   |----------|-------|--------|
   | IDE | JetBrains | No IDE-specific debug/launch configuration reference available. Best-effort configuration will be generated. |
