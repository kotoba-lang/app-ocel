/**
 * ocel kotoba — event registry (slice 1, 1/1 canonical complete).
 *
 *   recordEvent  — record an Event (rkey=event-{eventId-slug}, idempotent)
 *                  Validates eventId slug; rejects invalid.
 *   getEvent     — rkey-direct read
 *   listEvents   — cursor + activity/objectType/since filter
 */

import type { Etzhayyim } from "@etzhayyim/sdk";
import {
  eventDid,
  eventRkey,
  isValidEventPhase,
  isValidEventStatus,
  slugifyEventId,
  type EventRecord,
  type EventView,
  type GetEventInput,
  type GetEventOutput,
  type ListEventsInput,
  type ListEventsOutput,
  type RecordEventInput,
  type RecordEventOutput,
} from "./types.js";

const EVENT_COLLECTION = "com.etzhayyim.ocel.event";

const PAGE_LIMIT = 100;

export async function recordEvent(
  e: Etzhayyim,
  input: RecordEventInput
): Promise<RecordEventOutput> {
  if (
    !input.eventId ||
    !input.eventType ||
    !input.activity ||
    !input.actorDid
  ) {
    return { status: "rejected", error: "missingRequiredFields" };
  }

  if (!isValidEventPhase(input.phase)) {
    return { status: "invalid", error: "invalidEventPhase" };
  }

  if (!isValidEventStatus(input.status)) {
    return { status: "invalid", error: "invalidEventStatus" };
  }

  const slug = slugifyEventId(input.eventId);
  if (!slug) {
    return { status: "invalid", error: "invalidEventId" };
  }

  const rkey = eventRkey(slug);
  const existing = await e
    .read<EventRecord>({ collection: EVENT_COLLECTION, rkey })
    .catch(() => ({ records: [] }));

  if (existing.records[0]?.value) {
    return {
      status: "alreadyExists",
      eventUri: existing.records[0].uri,
      did: existing.records[0].value.did,
      eventId: slug,
    };
  }

  const did = eventDid(slug);
  const now = new Date().toISOString();
  const record: EventRecord = {
    did,
    specVersion: "1.0",
    eventId: input.eventId,
    eventType: input.eventType,
    activity: input.activity,
    phase: input.phase,
    status: input.status,
    ts: input.timestamp || now,
    timestamp: input.timestamp || now,
    actorDid: input.actorDid,
    objectType: input.objectType,
    objectId: input.objectId,
    objects: input.objects,
    relatedObjects: input.relatedObjects,
    attributes: input.attributes,
    error: input.error,
    createdAt: now,
  };

  const receipt = await e.write({
    collection: EVENT_COLLECTION,
    record: record as unknown as Record<string, unknown>,
    rkey,
  });

  return {
    status: "recorded",
    eventUri: receipt.uri,
    did,
    eventId: slug,
  };
}

export async function getEvent(
  e: Etzhayyim,
  input: GetEventInput
): Promise<GetEventOutput> {
  if (!input.eventId) return { error: "missingEventId" };

  const slug = slugifyEventId(input.eventId);
  if (!slug) return { error: "invalidEventId" };

  const resp = await e
    .read<EventRecord>({
      collection: EVENT_COLLECTION,
      rkey: eventRkey(slug),
    })
    .catch(() => ({ records: [] }));

  const r = resp.records[0];
  if (!r) return { error: "notFound" };

  const view: EventView = { ...r.value, eventUri: r.uri };
  return { event: view };
}

export async function listEvents(
  e: Etzhayyim,
  input: ListEventsInput = {}
): Promise<ListEventsOutput> {
  const limit = Math.min(input.limit ?? 50, 200);
  const resp = await e.read<EventRecord>({
    collection: EVENT_COLLECTION,
    cursor: input.cursor,
    limit,
  });

  const items: EventView[] = resp.records
    .filter((r) => {
      const v = r.value;
      if (input.activity && v.activity !== input.activity) return false;
      if (input.objectType && v.objectType !== input.objectType) return false;
      if (input.since && v.timestamp < input.since) return false;
      return true;
    })
    .map((r) => ({ ...r.value, eventUri: r.uri }));

  return { items, cursor: resp.cursor, total: items.length };
}
