import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Icon } from "@/content/icons";
import { siteConfig } from "@/content/site";

const { brand, nav, contact, footer } = siteConfig;

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

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="group flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-background">
            <Icon name="building" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {brand.prefix}{" "}
            <span className="text-accent transition-colors group-hover:text-accent-hover">
              {brand.highlight}
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Button href={`#${contact.id}`} size="sm">
            {nav.cta}
          </Button>
        </div>

        <details className="relative md:hidden">
          <summary className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground">
            <Icon name="menu" />
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`#${contact.id}`}
              className="mt-1 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-background"
            >
              {nav.cta}
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}

function Contact() {
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

function Footer() {
  const companyName = `${brand.prefix} ${brand.highlight}`;

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} {companyName}. {footer.rights}
        </p>
        <p>{footer.address}</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <BenefitsSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
