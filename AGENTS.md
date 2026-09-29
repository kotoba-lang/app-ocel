# etzhayyim-project-ocel

OCEL v2 Process Mining platform (`ocel.etzhayyim.com`)。**wRPC stream-native reactive pipeline (Design E)**。PDS commit stream を Follow → ComAtprotoSyncSubscribeRepos で OCEL v2 event に変換 → SQL でプロセスマイニング (DFG/Variant/Conformance/Performance)。

performerType: `system` (observability infrastructure)

## Runtime

**TS Native + `@etzhayyim/kotodama-host-sdk`**。Single-file: `wasm/ocel-core-component/src/app.ts`。

| 項目 | 値 |
|---|---|
| Language | TS Native (`@etzhayyim/kotodama-host-sdk`) |
| Architecture | **wRPC stream-native reactive** (Design E) |
| UI mode | `appview` (Protocol Canvas card) |
| Input | `ComAtprotoSyncSubscribeRepos` — PDS commit stream (profile/auth/deploy/social events) |
| Output (stream) | `HandleStream("stream-events")` — wRPC stream to subscribers |
| Output (social) | `AppBskyFeedPost(collectorDID)` — anomaly alerts |
| Read | `G()` (SQL) for DFG/variant/conformance/performance queries |

## OCEL v2 Data Model (IEEE 1849-2023)

### Object Types `[DESIGN]`

| Object Type | Description | Source |
|---|---|---|
| `actor` | DID (profile resolution target) | PDS GetProfile |
| `profile` | Profile/Profile node | PDS profile CRUD |
| `session` | Auth session | PDS authenticate() |
| `deploy` | Deploy pipeline run | etzhayyim deploy |
| `app` | App | registerProfileToYata |
| `worker` | Worker instance | account-level Worker |
| `record` | AT Record | ComAtprotoRepoCreateRecord |
| `convo` | Conversation/DM | WprotoConvoCreateDm |

### Activity Taxonomy `[DESIGN]`

| Namespace | Activities |
|---|---|
| `profile:*` | resolve, fallback_pds, fallback_none, graph_error |
| `auth:*` | clerk_jwt, internal_token, service_binding, anonymous, enrich_from_graph |
| `deploy:*` | build, transpile, upload, register_profile, smoke_test |
| `evolution:*` | heartbeat, post, like, follow |
| `record:*` | create, update, delete, read |

### Lexicon (AT Protocol Record Kinds) `[DESIGN]`

| Kind | AT Lexicon NSID | Description |
|---|---|---|
| `ocel_event` | `com.etzhayyim.apps.ocel.event` | OCEL v2 event record |
| `ocel_object_type` | `com.etzhayyim.apps.ocel.object_type` | Object type definition |
| `ocel_process_model` | `com.etzhayyim.apps.ocel.process_model` | DFG + variant model |

## Process Mining Algorithms `[DESIGN]`

| Algorithm | Command | Description |
|---|---|---|
| **DFG** | `BuildDFG` | Directly-Follows Graph — count activity transitions per object trace |
| **Variant Analysis** | `AnalyzeVariants` | Group traces by activity sequence, rank by frequency |
| **Conformance Checking** | `CheckConformance` | Compare observed traces against expected path (subsequence match) |
| **Performance Analysis** | `AnalyzePerformance` | Compute avg/max transition latency per activity pair |

## Collector Entity System `[DESIGN]`

| Collector | DID | Scope |
|---|---|---|
| PDS Event | `did:web:ocel.etzhayyim.com:collector:pds` | General PDS commit events |
| Profile Resolution | `did:web:ocel.etzhayyim.com:collector:profile` | Profile fallback tracking |
| Auth Flow | `did:web:ocel.etzhayyim.com:collector:auth` | Authentication patterns |
| Deploy Pipeline | `did:web:ocel.etzhayyim.com:collector:deploy` | Build/deploy lifecycle |
| Social Evolution | `did:web:ocel.etzhayyim.com:collector:social` | Heartbeat/engagement patterns |

## Reactive Pipeline (Design E)

```
PDS commit stream → Follow → ComAtprotoSyncSubscribeRepos → extract OCEL event
  → ComAtprotoRepoCreateRecord("ocelEvent", ...) [Tier 2: domain]
  → isAnomaly? → AppBskyFeedPost(collectorDID) [Tier 1: social alert]
  → stream-events → subscriber apps/UI
```

## yoro Activity Log Integration `[IMPLEMENTED]`

yoro.etzhayyim.com `/activities` consumes `OcelEvent` graph label alongside Bluesky notifications and Shinka evolution records to present a unified OCEL v2 activity timeline. Design: `docs/yoro/260405-yoro-ocel-activity-log-design.md`

| XRPC (yoro side) | Source from OCEL |
|---|---|
| `com.etzhayyim.yoro.activity.listActivities` | `OcelEvent` label → `deploy:*`, `record:*`, `profile:*`, `auth:*` activities |
| `com.etzhayyim.yoro.activity.getActivityTrace` | `OcelEvent` label filtered by objectType + objectId |

## SQL Process Mining Queries `[DESIGN]`

```sql
// Variant analysis
MATCH (e:OcelEvent) WHERE e.object_type = 'actor'
WITH e.object_id AS oid, collect(e.activity ORDER BY e.timestamp) AS trace
RETURN trace, count(*) AS freq ORDER BY freq DESC

// DFG transitions
MATCH (e1:OcelEvent)-[:DF]->(e2:OcelEvent)
RETURN e1.activity, e2.activity, count(*) AS freq

// Profile fallback rate (code quality metric)
MATCH (e:OcelEvent) WHERE e.activity STARTS WITH 'profile:'
RETURN e.activity, count(*) AS cnt,
       count(*) * 100.0 / sum(count(*)) OVER () AS pct
```
