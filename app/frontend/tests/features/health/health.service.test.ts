import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { publicClient } from "@/api/client";
import { getHealthLiveness } from "@/features/health/health.service";

describe("getHealthLiveness", () => {
  it("uses a route relative to the API base URL", async () => {
    const originalGet = publicClient.get;
    const calls: unknown[][] = [];

    publicClient.get = (async (...arguments_: unknown[]) => {
      calls.push(arguments_);
      return { data: { status: "UP" } };
    }) as unknown as typeof publicClient.get;

    try {
      assert.deepEqual(await getHealthLiveness(), { status: "UP" });
      assert.deepEqual(calls, [["/health"]]);
    } finally {
      publicClient.get = originalGet;
    }
  });
});
