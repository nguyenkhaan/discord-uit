import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { privateClient, publicClient } from "@/api/client";

describe("HTTP clients", () => {
  it("includes credentials on public and private requests", () => {
    assert.equal(publicClient.defaults.withCredentials, true);
    assert.equal(privateClient.defaults.withCredentials, true);
  });
});
