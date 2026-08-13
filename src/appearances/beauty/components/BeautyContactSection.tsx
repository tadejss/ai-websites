import { BeautyButton } from "./BeautyButton";
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

  return (
    <section
      id={contact.id}
      className="bg-background px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          variant="beauty"
          eyebrow={contact.eyebrow}
          title={contact.title}
          description={contact.description}
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            {contact.items.map((item) => (
              <div
                key={item.label}
                className="flex gap-4 rounded-[var(--radius-card)] bg-surface p-6"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-accent/10 bg-background text-accent">
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

          <div className="rounded-[var(--radius-card)] bg-surface p-7 sm:p-9">
            <ContactForm
              siteSlug={siteSlug}
              siteConfig={siteConfig}
              labelClassName="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted"
              inputClassName="mt-2 min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent disabled:opacity-60"
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
