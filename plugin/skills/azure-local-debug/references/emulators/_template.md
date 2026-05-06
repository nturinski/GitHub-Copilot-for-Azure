# {Emulator Name}

> **Template** — Copy to `emulators/{name}.md` for new emulator.

---

## Docker Image

<!-- Official image + recommended pinned tag. -->

```
{org}/{image}:{tag}
```

## docker-compose Service Block

<!-- Complete service YAML block, paste-ready. Includes ports, volumes, health check. -->

```yaml
services:
  {service-name}:
    image: {org}/{image}:{tag}
    ports:
      - "{host-port}:{container-port}"
    volumes:
      - ./.{service-name}:/data
    restart: unless-stopped
```

## Connection String

<!-- Default local connection string. -->

```
{connection-string}
```

## Required App Environment Variables

<!-- Vars app must set to reach this emulator. -->

| Variable | Value |
|----------|-------|
| `{VAR_NAME}` | `{value}` |

## Healthcheck (Database Emulators Only)

<!-- For DB emulators: include healthcheck in docker-compose block above + document here. Migration service (migrations.md) uses `condition: service_healthy` to wait before running migrations. No healthcheck = no auto-migration. Delete section if not DB emulator. -->

## Notes

<!-- Platform caveats (arm64/x86), known issues, resource reqs. -->
