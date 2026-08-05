import { Icon } from "@/content/icons";
import { siteConfig } from "@/content/site";
import { Section } from "@/components/ui/Section";

const { services } = siteConfig;

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

export function ServicesSection() {
  return (
    <Section id={services.id}>
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
    </Section>
  );
}
