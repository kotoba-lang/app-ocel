# ocel XRPC Adapter

CF Worker exposing 3 kotoba commands as XRPC endpoints.

## Endpoints

- `POST /xrpc/com.etzhayyim.ocel.recordEvent` — record event
- `GET /xrpc/com.etzhayyim.ocel.getEvent` — event by ID
- `GET /xrpc/com.etzhayyim.ocel.listEvents` — paginated list

## Deploy

```bash
wrangler deploy
```

See ADR-2605210000.
