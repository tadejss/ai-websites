import { getWebmailUrl } from "@/email/providers";
import { getEmailServiceWithDomain } from "@/email/store";
import type { BusinessEmailCustomerView } from "@/email/types";

export async function getBusinessEmailCustomerView(
  customerSlug: string,
): Promise<BusinessEmailCustomerView | null> {
  const bundle = await getEmailServiceWithDomain(customerSlug);
  if (!bundle) {
    return null;
  }

  const { service, mailbox } = bundle;

  if (service.status === "not_requested") {
    return null;
  }

  return {
    status: service.status,
    emailAddress: mailbox?.emailAddress ?? null,
    webmailUrl: service.status === "active" ? getWebmailUrl() : null,
  };
}
