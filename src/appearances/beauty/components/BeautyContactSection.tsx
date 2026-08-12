import { BeautyButton } from "./BeautyButton";
import { Icon } from "@/content/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyContactSection({ siteConfig }: Props) {
  const { contact } = siteConfig;
  const { form } = contact;

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

          <form className="rounded-[var(--radius-card)] bg-surface p-7 sm:p-9">
            <h3 className="font-display text-3xl leading-tight text-foreground">
              {form.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              {form.description}
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="beauty-name"
                  className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted"
                >
                  {form.nameLabel}
                </label>
                <input
                  id="beauty-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
                  placeholder={form.namePlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="beauty-phone"
                  className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted"
                >
                  {form.phoneLabel}
                </label>
                <input
                  id="beauty-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
                  placeholder={form.phonePlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="beauty-message"
                  className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted"
                >
                  {form.messageLabel}
                </label>
                <textarea
                  id="beauty-message"
                  name="message"
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
                  placeholder={form.messagePlaceholder}
                />
              </div>
              <BeautyButton type="submit" variant="chocolate" className="w-full">
                {form.submitLabel}
              </BeautyButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
