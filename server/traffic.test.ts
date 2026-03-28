import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("traffic.metrics", () => {
  it("returns dataset and model metrics", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.traffic.metrics();

    expect(result.dataset.name).toBe("METR-LA");
    expect(result.dataset.sensors).toBe(207);
    expect(result.dataset.records).toBeGreaterThan(0);
    expect(result.models.random_forest.mae_mph).toBeGreaterThan(0);
    expect(result.models.lstm.mae_mph).toBeGreaterThan(0);
  });
});

describe("traffic.hourlyProfile", () => {
  it("returns 24 hourly speed predictions", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.traffic.hourlyProfile();

    expect(result).toHaveLength(24);
    result.forEach((entry) => {
      expect(entry.hour).toBeGreaterThanOrEqual(0);
      expect(entry.hour).toBeLessThanOrEqual(23);
      expect(entry.predicted_mph).toBeGreaterThan(0);
    });
  });
});

describe("traffic.testSeries", () => {
  it("returns 200 test series data points", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.traffic.testSeries();

    expect(result.length).toBe(200);
    result.forEach((entry) => {
      expect(entry.step).toBeGreaterThanOrEqual(0);
      expect(typeof entry.actual).toBe("number");
      expect(typeof entry.rf_pred).toBe("number");
      expect(typeof entry.lstm_pred).toBe("number");
    });
  });
});

describe("traffic.predict", () => {
  it("returns a valid prediction for a given hour and day", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.traffic.predict({ hour: 8, dow: 2 });

    expect(result.hour).toBe(8);
    expect(result.dow).toBe(2);
    expect(result.predicted_mph).toBeGreaterThan(0);
    expect(["Fast", "Moderate", "Slow"]).toContain(result.status);
  }, 30000);

  it("returns Slow status for rush hour (hour 17)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.traffic.predict({ hour: 17, dow: 1 }); // Tuesday 5PM

    expect(result.predicted_mph).toBeGreaterThan(0);
    expect(["Fast", "Moderate", "Slow"]).toContain(result.status);
  }, 30000);

  it("validates input bounds", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.traffic.predict({ hour: 25, dow: 2 })).rejects.toThrow();
    await expect(caller.traffic.predict({ hour: 8, dow: 8 })).rejects.toThrow();
  });
});
