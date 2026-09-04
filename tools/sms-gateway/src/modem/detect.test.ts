import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectModem } from "./detect.ts";
import { DryRunModem } from "./dry-run.ts";
import { HiLinkModem } from "./hilink.ts";

describe("detectModem dry-run guard", () => {
  it("never constructs HiLink when dryRun is true", async () => {
    const { modem, status } = await detectModem({
      dryRun: true,
      hilinkUrl: "http://127.0.0.1:9",
    });
    assert.equal(status.mode, "dry-run");
    assert.ok(modem instanceof DryRunModem);
    assert.equal(modem instanceof HiLinkModem, false);
    const send = await modem.sendSms("+38640123456", "secret-body");
    assert.equal(send.success, true);
    if (send.success) {
      assert.match(send.providerMessageId, /^dryrun-/);
    }
  });
});
