# PostgreSQL

> No Azure-provided emulator. Use standard `postgres` Docker image locally. If targeting **Azure Cosmos DB for PostgreSQL**, note no local emulator exists.

## Docker Image

```
postgres:16
```

## docker-compose Service Block

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: localdev
    volumes:
      - ./.postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
```

## Connection String

```
postgresql://postgres:postgres@localhost:5432/localdev
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/localdev` |
| `POSTGRES_CONNECTION_STRING` | `postgresql://postgres:postgres@localhost:5432/localdev` |

> Use whichever variable project ORM/SDK expects. Both forms shown as reference.

## Healthcheck

Healthcheck included in docker-compose block above. Uses `pg_isready` to verify PostgreSQL accepts connections. Migration service (see [migrations.md](../migrations.md)) depends on `condition: service_healthy` to wait before running migrations.

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 30s
```

## Notes

- Port 5432: standard PostgreSQL port.
- Default credentials (`postgres`/`postgres`) intentionally simple for local dev. Never use in production.
- Data persisted to `./.postgres/`.
