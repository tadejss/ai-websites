const navLinks = [
  { href: "#storitve", label: "Storitve" },
  { href: "#zakaj-mi", label: "Zakaj mi" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

const services = [
  {
    title: "Redno vzdrževanje",
    description:
      "Menjava olja, filtrov in tekočin po specifikacijah proizvajalca za dolgo življenjsko dobo vozila.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03a2.652 2.652 0 1 1 3.802 3.802l-3.03 2.496M11.42 15.17 8.59 12.34M15 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    ),
  },
  {
    title: "Diagnostika",
    description:
      "Napredna računalniška diagnostika za hitro in natančno odkrivanje napak v vseh sistemih.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
      />
    ),
  },
  {
    title: "Popravilo zavor",
    description:
      "Menjava oblog, kolutov in tekočine. Varnostna preverjanja po vsakem posegu.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    ),
  },
  {
    title: "Vulkanizerstvo",
    description:
      "Menjava in uravnoteženje pnevmatik, popravilo prebadin ter sezonska shranjevanje.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
    ),
  },
  {
    title: "Klimatski sistem",
    description:
      "Polnjenje hladilnega sredstva, tesnjenje in popravilo klimatskih naprav.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"
      />
    ),
  },
  {
    title: "Tehnični pregled",
    description:
      "Priprava vozila na tehnični pregled in odprava ugotovljenih pomanjkljivosti.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
] as const;

const benefits = [
  {
    stat: "25+",
    label: "let izkušenj",
    description:
      "Družinsko podjetje z dolgoletno tradicijo in tisoči zadovoljnih strank po vsej Sloveniji.",
  },
  {
    stat: "48 h",
    label: "hitra storitev",
    description:
      "Večino manjših popravil opravimo v dveh delovnih dneh, da ste čim prej spet na cesti.",
  },
  {
    stat: "100 %",
    label: "garancija",
    description:
      "Na vse izvedene storitve in nadomestne dele dajemo pisno garancijo za vaš mir.",
  },
] as const;

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-6"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

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
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a49.902 49.902 0 0 0-.244-3.865 8.25 8.25 0 0 0-2.8-5.045 8.25 8.25 0 0 0-5.045-2.8 49.902 49.902 0 0 0-3.865-.244c-.62.039-1.124.469-1.124 1.09V21"
              />
            </Icon>
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Avto Servis{" "}
            <span className="text-accent transition-colors group-hover:text-accent-hover">
              Novak
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#kontakt"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
          >
            Rezerviraj termin
          </a>
        </div>

        <details className="relative md:hidden">
          <summary className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground">
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </Icon>
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#kontakt"
              className="mt-1 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-background"
            >
              Rezerviraj termin
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
            Odprt danes do 18:00
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Vaš avtomobil v{" "}
            <span className="text-accent">varnih rokah</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Profesionalen avtoservis z več kot 25-letnimi izkušnjami. Hitro,
            pošteno in z garancijo na vsako storitev.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#kontakt"
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Rezerviraj termin
            </a>
            <a
              href="#storitve"
              className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-surface"
            >
              Naše storitve
            </a>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: "5.000+", label: "opravljenih servisov" },
            { value: "4,9", label: "povprečna ocena" },
            { value: "25+", label: "let izkušenj" },
            { value: "24 m", label: "garancija na delo" },
          ].map((item) => (
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
    <section id="storitve" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Storitve"
          title="Vse, kar vaše vozilo potrebuje"
          description="Od rednega vzdrževanja do kompleksnih popravil — poskrbimo za vsak detajl z originalnimi ali kakovostnimi nadomestnimi deli."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/30 hover:bg-surface-elevated"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-background">
                <Icon>{service.icon}</Icon>
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
    <section id="zakaj-mi" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Zakaj mi"
              title="Kakovost, ki ji zaupajo vozniki"
              description="Pri Novakih verjamemo v transparentnost, natančnost in osebni pristop. Vsako vozilo obravnavamo, kot da je naše lastno."
            />

            <ul className="mt-10 space-y-4">
              {[
                "Certificirani mehaniki z rednimi usposabljanji",
                "Brez skritih stroškov — ceno vedno potrdite vnaprej",
                "Nadomestno vozilo za večja popravila na voljo",
                "Digitalna zgodovina servisov za vaše vozilo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </Icon>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-6">
            {benefits.map((benefit) => (
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
  return (
    <section id="kontakt" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Kontakt"
          title="Rezervirajte termin še danes"
          description="Pokličite nas ali nas obiščite v delavnici. Odgovorimo v najkrajšem možnem času."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {[
              {
                label: "Naslov",
                value: "Industrijska cesta 12, 1000 Ljubljana",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                ),
              },
              {
                label: "Telefon",
                value: "+386 1 234 56 78",
                href: "tel:+38612345678",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                  />
                ),
              },
              {
                label: "E-pošta",
                value: "info@avtoservis-novak.si",
                href: "mailto:info@avtoservis-novak.si",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                ),
              },
              {
                label: "Delovni čas",
                value: "Pon–Pet: 7:00–18:00 · Sob: 8:00–13:00",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon>{item.icon}</Icon>
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
              Pošljite povpraševanje
            </h3>
            <p className="mt-1 text-sm text-muted">
              Izpolnite obrazec in odgovorili vam bomo v enem delovnem dnevu.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted">
                  Ime in priimek
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                  placeholder="Janez Novak"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-muted">
                  Telefon
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                  placeholder="+386 40 123 456"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-muted">
                  Sporočilo
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                  placeholder="Opišite težavo ali storitev, ki jo potrebujete..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
              >
                Pošlji povpraševanje
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Avto Servis Novak. Vse pravice pridržane.</p>
        <p>Industrijska cesta 12, 1000 Ljubljana</p>
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
