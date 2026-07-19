/**
 * ocel kotoba — barrel.
 *
 * Per ADR-2605203000 Option B Phase E reference impl. Object-Centric Event
 * Log (OCEL) process mining standard — event registry with activity, object,
 * actor tracking.
 *
 * Slice 1: 1 of 1 canonical lexicon ported.
 *   recordEvent + getEvent + listEvents
 */

export * from "./types.js";
export { recordEvent, getEvent, listEvents } from "./events.js";
