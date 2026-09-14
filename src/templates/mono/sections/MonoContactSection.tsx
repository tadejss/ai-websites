import type { ReactNode } from "react";
import type { SiteConfig } from "@/content/types/site";
import {
  getAddress,
  getEmail,
  getHours,
  getPhoneHref,
  getPhoneLabel,
} from "../../shared/contact-data";
import { PhoneCta } from "../../shared/PhoneCta";

type Props = {
  siteConfig: SiteConfig;
};

export function MonoContactSection({ siteConfig }: Props) {
  const address = getAddress(siteConfig);
  const emailItem = getEmail(siteConfig);
  const email = emailItem?.value || siteConfig.business?.email;
  const hours = getHours(siteConfig);
  const phone = getPhoneLabel(siteConfig);
  const phoneHref = getPhoneHref(siteConfig);

  const rows = [
    phone
      ? {
          key: "phone",
          label: "Telefon",
          content: (
            <a
              href={phoneHref || "#"}
              className="text-[1.125rem] font-medium tracking-tight text-[var(--foreground)] transition-colors hover:text-[var(--accent)] md:text-xl"
            >
              {phone}
            </a>
          ),
        }
      : null,
    email
      ? {
          key: "email",
          label: "E-pošta",
          content: (
            <a
              href={`mailto:${email}`}
              className="text-[1.125rem] font-medium tracking-tight text-[var(--foreground)] transition-colors hover:text-[var(--accent)] md:text-xl"
            >
              {email}
            </a>
          ),
        }
      : null,
    address
      ? {
          key: "address",
          label: "Lokacija",
          content: (
            <p className="text-[1.125rem] font-medium tracking-tight text-[var(--foreground)] md:text-xl">
              {address}
            </p>
          ),
        }
      : null,
    hours
      ? {
          key: "hours",
          label: "Delovni čas",
          content: (
            <p className="text-[1.125rem] font-medium tracking-tight text-[var(--foreground)] md:text-xl">
              {hours}
            </p>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    content: ReactNode;
  }>;

  return (
    <section
      id="kontakt"
      className="border-t border-[var(--border)] bg-[var(--background)] py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--muted)]">
              Stopite v stik
            </p>
            <h2 className="text-3xl font-medium leading-[1.1] tracking-tight text-[var(--foreground)] md:text-5xl">
              {siteConfig.contact.title || "Začnimo vaš projekt skupaj"}
            </h2>
            <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-[var(--muted)] md:text-lg">
              {siteConfig.contact.description ||
                "Za posvet, ogled lokacije ali informativno ponudbo nas kontaktirajte preko telefona ali elektronske pošte."}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PhoneCta
                siteConfig={siteConfig}
                className="!rounded-full !bg-[var(--foreground)] !px-8 !py-3.5 !text-sm !font-medium !text-[var(--background)]"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-8">
            <div className="divide-y divide-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              {rows.map((row) => (
                <div key={row.key} className="flex flex-col gap-1.5 py-5 first:pt-0 last:pb-0">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {row.label}
                  </p>
                  {row.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
