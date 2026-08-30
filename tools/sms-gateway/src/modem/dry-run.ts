import type { IncomingSms, ModemStatus, SendSmsResult, SmsModem } from "./types";

export class DryRunModem implements SmsModem {
  private inbox: IncomingSms[] = [];

  async getStatus(): Promise<ModemStatus> {
    return {
      connected: true,
      mode: "dry-run",
      detail: "SMS_DRY_RUN=true — no modem traffic",
    };
  }

  async sendSms(to: string, message: string): Promise<SendSmsResult> {
    const providerMessageId = `dryrun-${Date.now()}-${to.replace(/\D/g, "").slice(-6)}`;
    console.log(`[dry-run] Would send to ${to}: ${message.slice(0, 80)}…`);
    return { success: true, providerMessageId };
  }

  async listIncomingSms(): Promise<IncomingSms[]> {
    return this.inbox;
  }
}
