import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldDeleteAfterInbound } from "./poller.ts";

describe("inbound delete order", () => {
  it("deletes only after confirmed upstream push", () => {
    assert.equal(shouldDeleteAfterInbound(true), true);
    assert.equal(shouldDeleteAfterInbound(false), false);
  });
});
