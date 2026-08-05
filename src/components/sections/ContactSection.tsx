import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Icon } from "@/content/icons";
import { siteConfig } from "@/content/site";

const { contact } = siteConfig;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function ContactSection() {
  const { form } = contact;

  return (
    <Section id={contact.id}>
      <SectionHeading
        eyebrow={contact.eyebrow}
        title={contact.title}
        description={contact.description}
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

        <form className="rounded-2xl border border-border bg-surface-elevated p-8">
          <h3 className="text-lg font-semibold text-foreground">
            {form.title}
          </h3>
          <p className="mt-1 text-sm text-muted">{form.description}</p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted">
                {form.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder={form.namePlaceholder}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-muted">
                {form.phoneLabel}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder={form.phonePlaceholder}
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-muted">
                {form.messageLabel}
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder={form.messagePlaceholder}
              />
            </div>
            <Button type="submit" size="md">
              {form.submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
}
