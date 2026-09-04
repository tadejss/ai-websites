import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";
import { Icon } from "@/content/icons";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
  headingVariant?: "default" | "beauty" | "trade";
};

export function ContactSection({
  siteConfig,
  siteSlug,
  headingVariant = "default",
}: Props) {
  const { contact } = siteConfig;

  return (
    <Section id={contact.id}>
      <SectionHeading
        eyebrow={contact.eyebrow}
        title={contact.title}
        description={contact.description}
        variant={headingVariant}
      />

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {contact.items.map((item) => (
            <div
              key={item.label}
              className="flex gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon name={item.icon} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted">{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-0.5 font-semibold text-foreground transition-colors hover:text-accent"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-0.5 font-semibold text-foreground">
                    {item.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-8">
          <ContactForm
            siteSlug={siteSlug}
            siteConfig={siteConfig}
            labelClassName="block text-sm font-medium text-muted"
            inputClassName="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent disabled:opacity-60"
            submitButton={
              <Button type="submit" size="md">
                {contact.form.submitLabel}
              </Button>
            }
          />
        </div>
      </div>
    </Section>
  );
}
