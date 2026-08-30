import { DryRunModem } from "./dry-run";
import { HiLinkModem } from "./hilink";
import type { ModemStatus, SmsModem } from "./types";

export async function detectModem(input: {
  dryRun: boolean;
  hilinkUrl: string;
}): Promise<{ modem: SmsModem; status: ModemStatus }> {
  if (input.dryRun) {
    const modem = new DryRunModem();
    return { modem, status: await modem.getStatus() };
  }

  const hilink = new HiLinkModem(input.hilinkUrl);
  const status = await hilink.getStatus();
  if (status.connected) {
    return { modem: hilink, status };
  }

  return {
    modem: hilink,
    status: {
      ...status,
      mode: "disconnected",
      detail:
        status.detail ||
        `HiLink not reachable at ${input.hilinkUrl}. Plug in E3372h and open the HiLink page.`,
    },
  };
}
