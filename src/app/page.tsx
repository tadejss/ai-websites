import { Icon } from "@/content/icons";
import { siteConfig } from "@/content/site";

const { brand, nav, hero, services, whyChooseUs, contact, footer } = siteConfig;

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
          <a
            href={`#${contact.id}`}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
          >
            {nav.cta}
          </a>
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

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.18),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[4rem_4rem]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            {hero.badge}
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {hero.title}{" "}
            <span className="text-accent">{hero.titleHighlight}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            {hero.description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href={`#${contact.id}`}
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              {hero.primaryCta}
            </a>
            <a
              href={`#${services.id}`}
              className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-surface"
            >
              {hero.secondaryCta}
            </a>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {hero.stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-surface/50 p-5 backdrop-blur-sm"
            >
              <dt className="text-2xl font-bold text-accent sm:text-3xl">
                {item.value}
              </dt>
              <dd className="mt-1 text-sm text-muted">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id={services.id} className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={services.eyebrow}
          title={services.title}
          description={services.description}
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((service) => (
            <article
              key={service.title}
              className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/30 hover:bg-surface-elevated"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-background">
                <Icon name={service.icon} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  return (
    <section id={whyChooseUs.id} className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow={whyChooseUs.eyebrow}
              title={whyChooseUs.title}
              description={whyChooseUs.description}
            />

            <ul className="mt-10 space-y-4">
              {whyChooseUs.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon name="check" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-6">
            {whyChooseUs.benefits.map((benefit) => (
              <article
                key={benefit.label}
                className="rounded-2xl border border-border bg-surface-elevated p-8"
              >
                <p className="text-4xl font-bold text-accent">{benefit.stat}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-foreground">
                  {benefit.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const { form } = contact;

  return (
    <section id={contact.id} className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
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
              <button
                type="submit"
                className="w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
              >
                {form.submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
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
        <Hero />
        <Services />
        <WhyChooseUs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
