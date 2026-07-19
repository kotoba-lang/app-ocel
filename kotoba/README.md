# ocel kotoba

Phase E Option B reference implementation of ocel (Object-Centric Event Log) on the etzhayyim substrate.

Per [ADR-2605203000](../../../90-docs/adr/2605203000-kotoba-write-target-options.md), ocel migrates from vendor's `createKyselyDb` pattern to **Option B** — PDS XRPC writes via `@etzhayyim/sdk e.write()`.

Coverage: **1 of 1 (100%) canonical** ocel lexicon ported.

| Tier | Commands | Slice |
|---|---|---|
| Event Registry | recordEvent, getEvent, listEvents | **1** |

## Authority-chain DIDs

```
did:web:ocel.etzhayyim.com                    — controller
did:web:ocel.etzhayyim.com:event:{eventId}    — Event
```

## Event validation

- **Phase** enum: start, end, milestone, checkpoint, complete (`isValidEventPhase`)
- **Status** enum: pending, running, success, failure, cancelled, blocked (`isValidEventStatus`)
- **EventId** slug normalization: lowercase, alphanumeric + dash (`slugifyEventId`)

`recordEvent` rejects with `invalid` on bad phase or status. `getEvent` and `listEvents` accept normalized eventId.

## Usage

```ts
import { Etzhayyim } from "@etzhayyim/sdk";
import { recordEvent, getEvent, listEvents } from "@etzhayyim/ocel-kotoba";

const e = new Etzhayyim({
  did: "did:web:ocel.etzhayyim.com",
  pdsUrl: "https://pds.etzhayyim.com",
  l2RpcUrl: "https://mainnet.base.org",
});

const r = await recordEvent(e, {
  eventId: "proc-2026-05-20-001",
  eventType: "activity",
  activity: "invoice-review",
  phase: "start",
  status: "running",
  actorDid: "did:web:example.com:user:alice",
  objectType: "invoice",
  objectId: "inv-789",
  attributes: { amount: 1500, currency: "USD" },
});

const found = await getEvent(e, { eventId: "proc-2026-05-20-001" });

const list = await listEvents(e, {
  activity: "invoice-review",
  objectType: "invoice",
  limit: 50,
});
```

## Sibling reference impls (13 actors)

| Actor | Coverage | Status |
|---|---|---|
| hanrei | 31/31 | complete |
| ipaddress | 37/37 | complete |
| sbom | 17/N (canonical 4/4) | canonical complete |
| kiyo | 12/12 | complete |
| ki | 4/4 | complete |
| otakiage | 13 (10/10 canonical) | complete |
| houki | 9 (8/8 canonical) | complete |
| open-banking | 5/5 | complete |
| open-denki | 12/12 | complete |
| koke | 4/4 | complete |
| hakkou | 3 (2/2 canonical) | complete |
| isbn | 4/4 | complete |
| **ocel** | **1/1** | **complete** |
