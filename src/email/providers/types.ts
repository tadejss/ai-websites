export type EmailProviderName = "mxroute";

export type EmailDnsRecord = {
  type: "MX" | "TXT" | "CNAME";
  name: string;
  content: string;
  priority?: number;
  ttl?: number;
};

export type ProviderDomain = {
  domain: string;
  verified: boolean;
};

export type ProviderMailbox = {
  id: string;
  localPart: string;
  emailAddress: string;
  quotaMb: number | null;
  suspended: boolean;
};

export interface EmailProvider {
  readonly name: EmailProviderName;

  getDomain(domain: string): Promise<ProviderDomain | null>;
  createDomain(domain: string): Promise<ProviderDomain>;

  getMailbox(domain: string, localPart: string): Promise<ProviderMailbox | null>;
  createMailbox(input: {
    domain: string;
    localPart: string;
    password: string;
    quotaMb?: number;
  }): Promise<ProviderMailbox>;

  suspendMailbox(domain: string, localPart: string): Promise<void>;
  unsuspendMailbox(domain: string, localPart: string): Promise<void>;
  deleteMailbox(domain: string, localPart: string): Promise<void>;
  resetMailboxPassword(
    domain: string,
    localPart: string,
    password: string,
  ): Promise<void>;

  getDnsRecords(domain: string): Promise<EmailDnsRecord[]>;
  isDomainVerified(domain: string): Promise<boolean>;
}
