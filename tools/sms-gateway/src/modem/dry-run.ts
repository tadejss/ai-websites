import type {
  DeleteSmsResult,
  IncomingSms,
  ModemStatus,
  SendSmsResult,
  SmsModem,
} from "./types";

export class DryRunModem implements SmsModem {
  private inbox: IncomingSms[] = [];

  async getStatus(): Promise<ModemStatus> {
    return {
      connected: true,
      mode: "dry-run",
      detail: "SMS_DRY_RUN=true — no modem traffic",
    };
  }

  async sendSms(to: string, _message: string): Promise<SendSmsResult> {
    const providerMessageId = `dryrun-${Date.now()}-${to.replace(/\D/g, "").slice(-6)}`;
    console.log(`[dry-run] Would send to ${to} (body omitted)`);
    return { success: true, providerMessageId };
  }

  async listIncomingSms(): Promise<IncomingSms[]> {
    return this.inbox;
  }

  async deleteSms(_id: string): Promise<DeleteSmsResult> {
    return { success: true };
  }
}
