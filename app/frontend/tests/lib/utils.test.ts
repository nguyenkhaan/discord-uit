import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combines conditional class values", () => {
    const isHidden = false;

    assert.equal(
      cn("block", isHidden && "hidden", { "font-bold": true }),
      "block font-bold",
    );
  });

  it("keeps the last conflicting Tailwind utility", () => {
    assert.equal(cn("px-2", "px-4"), "px-4");
  });
});
