import { BeautyButton } from "./BeautyButton";
import { buttonRadiusClass, cardClassForLook, iconWellClassForLook, sectionSpacingForLook } from "@/catalog/look-styles";
import { resolveLookDesignTokens } from "@/catalog/resolve-look";
import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export function BeautyContactSection({ siteConfig, siteSlug }: Props) {
  const { contact } = siteConfig;
  const designTokens = resolveLookDesignTokens(siteConfig);
  const cardClass = designTokens
    ? `${cardClassForLook(designTokens)} p-6`
    : "rounded-[var(--radius-card)] bg-surface p-6";
  const formCardClass = designTokens
    ? `${cardClassForLook(designTokens)} p-7 sm:p-9`
    : "rounded-[var(--radius-card)] bg-surface p-7 sm:p-9";
  const iconWellClass = designTokens
    ? iconWellClassForLook(designTokens)
    : "rounded-full";
  const sectionClass = designTokens
    ? sectionSpacingForLook(designTokens)
    : "py-24 sm:py-32";
  const inputRadiusClass = buttonRadiusClass();

  return (
    <section
      id={contact.id}
      className={`bg-background px-4 sm:px-6 ${sectionClass}`}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          variant="beauty"
          eyebrow={contact.eyebrow}
          title={contact.title}
          description={contact.description}
        />

        {contact.faq && contact.faq.length > 0 ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {contact.faq.map((item) => (
              <article
                key={item.question}
                className={cardClass}
              >
                <h3 className="font-display text-lg text-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        ) : null}

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            {contact.items.map((item) => (
              <div
                key={item.label}
                className={`flex gap-4 ${cardClass}`}
              >
                <div className={`flex size-12 shrink-0 items-center justify-center border border-accent/10 bg-background text-accent ${iconWellClass}`}>
                  <Icon name={item.icon} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-1 block font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium text-foreground">
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={formCardClass}>
            <ContactForm
                siteSlug={siteSlug}
                siteConfig={siteConfig}
                labelClassName="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted"
                inputClassName={`mt-2 min-h-12 w-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent disabled:opacity-60 ${inputRadiusClass}`}
                submitButton={
                  <BeautyButton type="submit" variant="chocolate" className="w-full">
                    {contact.form.submitLabel}
                  </BeautyButton>
                }
              />
          </div>
        </div>
      </div>
    </section>
  );
}
