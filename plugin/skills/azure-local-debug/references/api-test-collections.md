# API Test Collection Patterns

> Reference for generating `api-test-collections/local-development/` scripts. Language-agnostic commands exercising running app + live emulators.

---

## HTTP

HTTP patterns use `{baseUrl}` — project type supplies base URL (e.g., `http://localhost:7071/api` for Functions). Other patterns target emulator directly, reusable across project types.

### GET request

```sh
#!/bin/bash
curl -i "{baseUrl}/{FunctionName}"
```

### POST with JSON body

```sh
#!/bin/bash
curl -i -X POST "{baseUrl}/{FunctionName}" \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

> **`{baseUrl}` by project type:**
>
> | Project Type | Base URL |
> |-------------|---------|
> | Azure Functions | `http://localhost:7071/api` |
> | Container App | `http://localhost:{port}` (from Dockerfile `EXPOSE`) |
> | App Service | `http://localhost:{port}` (from framework dev server) |

---

## Storage (Azurite — Blob / Queue / Table)

> Requires Azurite running. All commands use `--connection-string "UseDevelopmentStorage=true"`.

### Blob trigger — upload a file

```sh
#!/bin/bash
az storage blob upload \
  --connection-string "UseDevelopmentStorage=true" \
  --container-name {container-name} \
  --name "sample-file.json" \
  --file sample-file.json \
  --overwrite
```

### Queue trigger — send a message

```sh
#!/bin/bash
az storage message put \
  --connection-string "UseDevelopmentStorage=true" \
  --queue-name {queue-name} \
  --content '{"id": "test-001", "data": "sample"}'
```

### Table trigger — insert an entity

```sh
#!/bin/bash
az storage entity insert \
  --connection-string "UseDevelopmentStorage=true" \
  --table-name {table-name} \
  --entity PartitionKey=pk RowKey=rk001 Value=test
```

---

## Cosmos DB

> Requires Cosmos DB Emulator on `https://localhost:8081`. Disable TLS verification for local calls.

### Insert a document

```sh
#!/bin/bash
curl -k -X POST "https://localhost:8081/dbs/{database}/colls/{collection}/docs" \
  -H "Authorization: type=master&ver=1.0&sig=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==" \
  -H "Content-Type: application/json" \
  -H "x-ms-documentdb-partitionkey: [\"test\"]" \
  -H "x-ms-version: 2018-12-31" \
  -d '{"id": "test-001", "partitionKey": "test", "data": "sample"}'
```

> `-k` disables TLS verification for emulator self-signed cert. Never use in production.

---

## Service Bus

> Requires Service Bus Emulator running. Uses `az servicebus` CLI or Service Bus REST API.

### Send a message to a queue

```sh
#!/bin/bash
az servicebus queue message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --queue-name {queue-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

### Send a message to a topic

```sh
#!/bin/bash
az servicebus topic message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --topic-name {topic-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

---

## Event Hubs

> Requires Event Hubs Emulator running.

### Send an event

```sh
#!/bin/bash
az eventhubs eventhub message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --eventhub-name {eventhub-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

---

## Timer (Azure Functions only)

Timer triggers can't fire externally — Functions host fires on schedule. Use Functions admin API for on-demand trigger:

```sh
#!/bin/bash
curl -i -X POST "http://localhost:7071/admin/functions/{FunctionName}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

> Calls Functions admin endpoint, only available locally. `{}` body required; timer trigger ignores it.

---

## Generation Rules

When generating `api-test-collections/local-development/` during Phase 2:

1. One subdirectory per trigger/endpoint found during inventory
2. Name directory after trigger: `{trigger-type}-{function-or-endpoint-name}` (e.g., `http-GetOrder`, `blob-ProcessUpload`)
3. Create `invoke.sh` with appropriate pattern from this file, substituting discovered values (function name, container name, queue name, etc.)
4. Create `sample-data.json` or `sample-message.json` next to `invoke.sh` when test requires body
5. `chmod +x invoke.sh`

> **Skip timer test scripts** unless user explicitly requests — rarely needed for local debugging.

---

## Plan Section Formatting Rules

In **API Test Collections** plan section, heading format varies by trigger type. Subfolder names under `api-test-collections/local-development/` (e.g., `http-register`, `http-createOrder`) must appear in each section's markdown heading so users see which routes map to which script.

---

### HTTP triggers / web API endpoints

```
### {METHOD} {route} [{🔒}] `{folder-name}`
```

- **`{METHOD} {route}`** — HTTP verb + full route path (e.g., `GET /api/health`)
- **`🔒`** — Include when endpoint requires auth (Bearer JWT, API key, etc.). Omit for anonymous/public endpoints.
- **`` `{folder-name}` ``** — Exact folder name under `api-test-collections/local-development/` (e.g., `` `http-health` ``)

**Examples:**

```markdown
### GET /api/health `http-health`

### POST /api/auth/register `http-register`

### GET /api/auth/me 🔒 `http-getMe`

### POST /api/orders 🔒 `http-createOrder`
```

**Auth key** — add once atop API Test Collections section, after folder tree, when any 🔒 routes exist:

```markdown
> 🔒 = requires authentication (replace `<token>` with a JWT from the login endpoint before running)
```

---

### Non-HTTP triggers (blob, queue, Service Bus, Event Hubs, etc.)

```
### {TriggerType}: {function-or-resource-name} `{folder-name}`
```

- **`{TriggerType}`** — Trigger category: `Blob`, `Queue`, `Service Bus`, `Event Hubs`, `Table`, `Cosmos DB`, etc.
- **`{function-or-resource-name}`** — Function name or targeted resource (container, queue, topic name, etc.)
- **`` `{folder-name}` ``** — Exact folder name under `api-test-collections/local-development/` (e.g., `` `blob-ProcessUpload` ``)

**Examples:**

```markdown
### Blob: uploads container `blob-processUpload`

### Queue: order-requests `queue-sendOrder`

### Service Bus: invoices topic `servicebus-sendInvoice`

### Event Hubs: telemetry `eventhubs-sendTelemetry`
```

> 🔒 indicator doesn't apply to non-HTTP triggers — invoked by pushing data into resource directly, not via authenticated HTTP call.
