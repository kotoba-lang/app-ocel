# app-ocel（event admission）— itonami（dapp）上の分散型設計

状態: 第 1 スライス実装（2026-10-20）。正本はこの文書。
追跡: Linear JUN-128（親 JUN-116）。

## 位置づけ

app-ocel は **OCEL v2 プロセスマイニング**（ocel.etzhayyim.com）—— PDS
commit ストリームを Follow して OCEL v2 event に変換し、SQL で
DFG / Variant / Conformance / Performance を出す（wRPC stream-native）。
本スライスは **イベント記録の admission 判定**（`recordEvent`）を判定コア化。

## このスライス: OCEL event 判定コア

| 層 | 実体 | 状態 |
|---|---|---|
| 判定コア guest | `aiueos/ocel_event.cljk` — event-admission（必須 4 フィールド欠落 = missingRequiredFields / phase・status の**閉じた集合**外 = invalidEventPhase・invalidEventStatus / slug 失敗 = invalidEventId）/ phase-ok（start..complete の 5）/ status-ok（pending..blocked の 6）/ dedup-take（rkey=event-{slug} は冪等） | **実装済み・実測** |
| 記述子 | `aiueos/ocel-event.edn` | **実装済み** |
| parity | `kotoba/test/ocel/event_parity_test.cljk` — 正本（events.ts / types.ts）の閉じた集合・エラー名・必須フィールドと一致 | **実装済み・実測** |

実測: `amu test aiueos/ocel_event.cljk` → **21/21**（jvm-kir / js / wasm）。
parity → 17 assertions / 0 failures。

## 正本の正確な規則（guest はこれに追従）

- 必須: `eventId` / `eventType` / `activity` / `actorDid`（欠落 = 拒否）。
- **EventPhase** = start / end / milestone / checkpoint / complete（5 つ）。
- **EventStatus** = pending / running / success / failure / cancelled /
  blocked（6 つ）。両方とも閉じた集合 —— guest はコードで判定し、集合外は
  既定を作らない。
- `slugifyEventId` が空なら invalidEventId。rkey=event-{slug} は**冪等**
  （同一 eventId の再記録は dedup）。

## 未実装境界

- DFG / Variant / Conformance / Performance の集計判定（プロセスマイニング
  の本体）。
- PDS commit → OCEL event 変換（wRPC Design E パイプライン）の判定。
- listEvents の filter（activity/objectType/since）の判定。
- mon（DNA）化、aiueos session 載せ（fleet 共通）。
