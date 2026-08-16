import { Icon } from "@/content/icons";
import { ZbrendirajSectionHeading } from "./ZbrendirajSectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";
import { ZbrendirajButton } from "./ZbrendirajButton";
import {
  zbCard,
  zbCardPadding,
  zbIconWrap,
  zbInputClassName,
  zbLabelClassName,
} from "../styles";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export function ZbrendirajContactSection({ siteConfig, siteSlug }: Props) {
  const { contact } = siteConfig;

  return (
    <section id={contact.id} className="bg-black px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <ZbrendirajSectionHeading
          eyebrow={contact.eyebrow}
          title={contact.title}
          description={contact.description}
        />

        {contact.faq && contact.faq.length > 0 ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {contact.faq.map((item) => (
              <article
                key={item.question}
                className="w-full rounded-[var(--radius-card)] bg-accent p-6"
              >
                <h3 className="font-display text-lg font-semibold text-black sm:text-xl">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black/70 sm:text-base">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        ) : null}

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            {contact.items.map((item) => (
              <div key={item.label} className={`flex gap-4 ${zbCard} p-6`}>
                <div className={zbIconWrap}>
                  <Icon name={item.icon} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9A9A9A]">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-1 block font-medium text-white transition-colors hover:text-accent"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium text-[#D0D0D0]">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`${zbCard} ${zbCardPadding} [&_h3]:text-white [&_p]:text-[#D0D0D0]`}>
            <ContactForm
              siteSlug={siteSlug}
              siteConfig={siteConfig}
              labelClassName={zbLabelClassName}
              inputClassName={zbInputClassName}
              submitButton={
                <ZbrendirajButton type="submit" className="w-full">
                  {contact.form.submitLabel}
                </ZbrendirajButton>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
