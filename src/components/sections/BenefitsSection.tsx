import { Icon } from "@/content/icons";
import { siteConfig } from "@/content/site";
import { Section } from "@/components/ui/Section";

const { whyChooseUs } = siteConfig;

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

export function BenefitsSection() {
  return (
    <Section id={whyChooseUs.id}>
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
    </Section>
  );
}
