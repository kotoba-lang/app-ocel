/**
 * ocel kotoba — record types.
 *
 * Per ADR-2605203000 Option B (PDS XRPC). Object-Centric Event Log (OCEL)
 * process mining standard. Event registry with activity, object, actor tracking.
 *
 * Identity hierarchy:
 *   did:web:ocel.etzhayyim.com                    — controller
 *   did:web:ocel.etzhayyim.com:event:{eventId}    — Event
 */

export const OCEL_DID_PREFIX = "did:web:ocel.etzhayyim.com:" as const;

export type EventPhase =
  | "start"
  | "end"
  | "milestone"
  | "checkpoint"
  | "complete";

export type EventStatus =
  | "pending"
  | "running"
  | "success"
  | "failure"
  | "cancelled"
  | "blocked";

// ─── Event tier (slice 1) ────────────────────────────────────────────

export interface EventRecord {
  did: string;
  specVersion: string;
  eventId: string;
  eventType: string;
  activity: string;
  phase: EventPhase;
  status: EventStatus;
  ts: string;
  timestamp: string;
  actorDid: string;
  objectType?: string;
  objectId?: string;
  objects?: Record<string, unknown>[];
  relatedObjects?: Record<string, unknown>[];
  attributes?: Record<string, unknown>;
  error?: Record<string, unknown>;
  createdAt: string;
}

export interface EventView extends EventRecord {
  eventUri: string;
}

export interface RecordEventInput {
  eventId: string;
  eventType: string;
  activity: string;
  phase: EventPhase;
  status: EventStatus;
  actorDid: string;
  objectType?: string;
  objectId?: string;
  objects?: Record<string, unknown>[];
  relatedObjects?: Record<string, unknown>[];
  attributes?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

export interface RecordEventOutput {
  status: "recorded" | "alreadyExists" | "rejected" | "invalid";
  eventUri?: string;
  did?: string;
  eventId?: string;
  error?: string;
}

export interface GetEventInput {
  eventId: string;
}

export interface GetEventOutput {
  event?: EventView;
  error?: string;
}

export interface ListEventsInput {
  activity?: string;
  objectType?: string;
  since?: string;
  limit?: number;
  cursor?: string;
}

export interface ListEventsOutput {
  items: EventView[];
  cursor?: string;
  total: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function slugifyEventId(eventId: string): string {
  return eventId
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function eventDid(eventIdSlug: string): string {
  return `${OCEL_DID_PREFIX}event:${eventIdSlug}`;
}

export function eventRkey(eventIdSlug: string): string {
  return `event-${eventIdSlug}`;
}

export function isValidEventPhase(phase: unknown): phase is EventPhase {
  return ["start", "end", "milestone", "checkpoint", "complete"].includes(
    phase as string
  );
}

export function isValidEventStatus(status: unknown): status is EventStatus {
  return [
    "pending",
    "running",
    "success",
    "failure",
    "cancelled",
    "blocked",
  ].includes(status as string);
}
