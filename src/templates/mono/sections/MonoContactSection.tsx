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

  return (
    <section id="kontakt" className="bg-[var(--background)] py-20 md:py-28 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-mono mb-2">
              Stopite v stik
            </p>
            <h2 className="text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-5xl leading-tight">
              {siteConfig.contact.title || "Začnimo vaš projekt skupaj"}
            </h2>
            <p className="mt-4 text-base text-[var(--muted)] max-w-md">
              {siteConfig.contact.description ||
                "Za posvet, ogled lokacije ali informativno ponudbo nas kontaktirajte preko telefona ali elektronske pošte."}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PhoneCta
                siteConfig={siteConfig}
                className="!rounded-full !px-8 !py-3.5 !bg-[var(--foreground)] !text-[var(--background)] !text-sm !font-medium"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 space-y-6">
            {phone && (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">
                  Telefon
                </p>
                <a
                  href={phoneHref || "#"}
                  className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                >
                  {phone}
                </a>
              </div>
            )}

            {email && (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">
                  E-pošta
                </p>
                <a
                  href={`mailto:${email}`}
                  className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                >
                  {email}
                </a>
              </div>
            )}

            {address && (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">
                  Lokacija
                </p>
                <p className="text-base text-[var(--foreground)]">{address}</p>
              </div>
            )}

            {hours && (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">
                  Delovni čas
                </p>
                <p className="text-base text-[var(--foreground)]">{hours}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
