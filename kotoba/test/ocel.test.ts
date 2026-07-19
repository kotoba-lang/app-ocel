import { describe, it, expect, beforeEach } from "vitest";
import { MockEtzhayyim } from "@etzhayyim/sdk-mock";
import { recordEvent, getEvent, listEvents } from "../src/index.js";

describe("ocel kotoba", () => {
  let e: any;

  beforeEach(() => {
    e = new MockEtzhayyim({ did: "did:web:ocel.etzhayyim.com" });
  });

  describe("recordEvent", () => {
    it("records an event with valid input", async () => {
      const result = await recordEvent(e, {
        eventId: "evt-order-001",
        eventType: "order-placed",
        activity: "CreateOrder",
        phase: "start",
        status: "success",
        actorDid: "did:plc:actor1",
        objectType: "Order",
        objectId: "oid-123",
      });

      expect(result.status).toBe("recorded");
      expect(result.eventUri).toBeDefined();
      expect(result.did).toBeDefined();
      expect(result.eventId).toBe("evt-order-001");
    });

    it("rejects event with missing required fields", async () => {
      const result = await recordEvent(e, {
        eventId: "",
        eventType: "order-placed",
        activity: "CreateOrder",
        phase: "start",
        status: "success",
        actorDid: "did:plc:actor1",
      });

      expect(result.status).toBe("rejected");
      expect(result.error).toBe("missingRequiredFields");
    });

    it("rejects event with invalid eventPhase", async () => {
      const result = await recordEvent(e, {
        eventId: "evt-001",
        eventType: "test",
        activity: "Test",
        phase: "invalid-phase" as any,
        status: "success",
        actorDid: "did:plc:actor1",
      });

      expect(result.status).toBe("invalid");
      expect(result.error).toBe("invalidEventPhase");
    });

    it("rejects event with invalid eventStatus", async () => {
      const result = await recordEvent(e, {
        eventId: "evt-002",
        eventType: "test",
        activity: "Test",
        phase: "start",
        status: "invalid-status" as any,
        actorDid: "did:plc:actor1",
      });

      expect(result.status).toBe("invalid");
      expect(result.error).toBe("invalidEventStatus");
    });

    it("is idempotent on eventId", async () => {
      const input = {
        eventId: "evt-dup",
        eventType: "duplicate-test",
        activity: "TestActivity",
        phase: "start" as const,
        status: "success" as const,
        actorDid: "did:plc:actor1",
      };

      const first = await recordEvent(e, input);
      expect(first.status).toBe("recorded");
      const firstUri = first.eventUri;

      const second = await recordEvent(e, input);
      expect(second.status).toBe("alreadyExists");
      expect(second.eventUri).toBe(firstUri);
    });

    it("accepts optional timestamp", async () => {
      const customTime = "2026-05-21T10:00:00Z";
      const result = await recordEvent(e, {
        eventId: "evt-with-ts",
        eventType: "test",
        activity: "Test",
        phase: "end",
        status: "success",
        actorDid: "did:plc:actor1",
        timestamp: customTime,
      });

      expect(result.status).toBe("recorded");
      const evt = await getEvent(e, { eventId: "evt-with-ts" });
      expect(evt.event?.timestamp).toBe(customTime);
    });
  });

  describe("getEvent", () => {
    beforeEach(async () => {
      await recordEvent(e, {
        eventId: "test-evt-001",
        eventType: "test-type",
        activity: "TestActivity",
        phase: "milestone",
        status: "success",
        actorDid: "did:plc:actor1",
        objectType: "TestObject",
        objectId: "obj-1",
        attributes: { key: "value" },
      });
    });

    it("retrieves an existing event", async () => {
      const result = await getEvent(e, { eventId: "test-evt-001" });

      expect(result.error).toBeUndefined();
      expect(result.event).toBeDefined();
      expect(result.event?.eventType).toBe("test-type");
      expect(result.event?.activity).toBe("TestActivity");
      expect(result.event?.eventUri).toBeDefined();
    });

    it("returns notFound for missing event", async () => {
      const result = await getEvent(e, { eventId: "nonexistent" });

      expect(result.error).toBe("notFound");
      expect(result.event).toBeUndefined();
    });

    it("returns missingEventId when eventId not provided", async () => {
      const result = await getEvent(e, { eventId: "" });

      expect(result.error).toBe("missingEventId");
      expect(result.event).toBeUndefined();
    });
  });

  describe("listEvents", () => {
    beforeEach(async () => {
      await recordEvent(e, {
        eventId: "order-create-001",
        eventType: "order-placed",
        activity: "CreateOrder",
        phase: "start",
        status: "success",
        actorDid: "did:plc:actor1",
        objectType: "Order",
        timestamp: "2026-05-21T08:00:00Z",
      });
      await recordEvent(e, {
        eventId: "order-ship-001",
        eventType: "order-shipped",
        activity: "ShipOrder",
        phase: "end",
        status: "success",
        actorDid: "did:plc:actor2",
        objectType: "Order",
        timestamp: "2026-05-21T09:00:00Z",
      });
      await recordEvent(e, {
        eventId: "payment-proc-001",
        eventType: "payment-processed",
        activity: "ProcessPayment",
        phase: "milestone",
        status: "success",
        actorDid: "did:plc:actor3",
        objectType: "Payment",
        timestamp: "2026-05-21T08:30:00Z",
      });
    });

    it("lists all events", async () => {
      const result = await listEvents(e, {});

      expect(result.items.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it("filters events by activity", async () => {
      const result = await listEvents(e, { activity: "CreateOrder" });

      expect(result.items.length).toBe(1);
      expect(result.items[0]?.activity).toBe("CreateOrder");
    });

    it("filters events by objectType", async () => {
      const result = await listEvents(e, { objectType: "Order" });

      expect(result.items.length).toBe(2);
      expect(result.items.every((e) => e.objectType === "Order")).toBe(true);
    });

    it("filters events by since timestamp", async () => {
      const result = await listEvents(e, { since: "2026-05-21T08:45:00Z" });

      expect(result.items.length).toBe(1);
      expect(result.items[0]?.eventId).toBe("order-ship-001");
    });

    it("combines multiple filters", async () => {
      const result = await listEvents(e, {
        activity: "ProcessPayment",
        objectType: "Payment",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]?.eventId).toBe("payment-proc-001");
    });

    it("respects limit parameter", async () => {
      const result = await listEvents(e, { limit: 2 });

      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it("caps limit at 200", async () => {
      const result = await listEvents(e, { limit: 500 });

      expect(result.items.length).toBeLessThanOrEqual(200);
    });
  });

  describe("integration: event recording and querying", () => {
    it("records multiple events and queries with filters", async () => {
      const events = [
        {
          eventId: "proc-001",
          activity: "InitializeProcess",
          objectType: "Process",
        },
        {
          eventId: "proc-002",
          activity: "ExecuteStep",
          objectType: "Process",
        },
        {
          eventId: "log-001",
          activity: "LogData",
          objectType: "Log",
        },
      ];

      for (const evt of events) {
        await recordEvent(e, {
          eventId: evt.eventId,
          activity: evt.activity,
          objectType: evt.objectType,
          eventType: `type-${evt.activity.toLowerCase()}`,
          phase: "start",
          status: "success",
          actorDid: "did:plc:test",
          objectId: `id-${evt.eventId}`,
        });
      }

      const procEvents = await listEvents(e, { objectType: "Process" });
      expect(procEvents.items.length).toBe(2);

      const logEvents = await listEvents(e, { activity: "LogData" });
      expect(logEvents.items.length).toBe(1);
      expect(logEvents.items[0]?.objectType).toBe("Log");
    });
  });
});
