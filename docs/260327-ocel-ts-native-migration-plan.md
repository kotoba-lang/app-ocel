# 260327 OCEL TS Native Pilot

対象: `60-apps/etzhayyim-project-ocel/wasm/ocel-core-component`

## Scope

- `src/app.ts` と `src/worker.ts` を追加して TS Native スキャフォールドを置く。
- コマンド: `ocel.list`, `ocel.detail`
- `/_heartbeat` を実装して `fetch` で default handleRequest をそのまま使う。
- `src/app.ts` を entry として esbuild bundle (wrangler が自動実行)。

## 実装内容（Pilot）

- `ocel.list`: `limit` と `q` を受けて `cypherQueryJson` を placeholder で実行し、結果を JSON で返却。
- `ocel.detail`: `id` で単件を検索し、見つからなければ `{ error: "not found" }`。
- `runHeartbeat`: 最低限の heartbeat action を返す。
- `createOcelHostSDK`: `appDef` + `createHostSDK` で app instance を生成し、commands を登録。

## 次アクション

1. `ocel-core-component` の `main.go` との整合を取りながら commit/stream の最小互換を追加。
2. `list`/`detail` を実運用 query 型へ置換。
