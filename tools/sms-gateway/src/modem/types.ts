export type ModemStatus = {
  connected: boolean;
  mode: "hilink" | "dry-run" | "disconnected";
  hilinkUrl?: string;
  signal?: string | null;
  networkType?: string | null;
  detail?: string;
};

export type SendSmsResult =
  | { success: true; providerMessageId: string }
  | { success: false; error: string };

export type IncomingSms = {
  providerMessageId: string;
  from: string;
  to?: string;
  body: string;
  receivedAt: string;
};

export interface SmsModem {
  getStatus(): Promise<ModemStatus>;
  sendSms(to: string, message: string): Promise<SendSmsResult>;
  listIncomingSms(): Promise<IncomingSms[]>;
}
