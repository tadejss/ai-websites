import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextList, TextListItem } from "@/components/ui/TextListItem";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function ServicesSection({ siteConfig }: Props) {
  const { services } = siteConfig;

  return (
    <Section id={services.id}>
      <SectionHeading
        eyebrow={services.eyebrow}
        title={services.title}
        description={services.description}
      />

      <TextList className="mx-auto mt-12 max-w-2xl space-y-10">
        {services.items.map((service) => (
          <TextListItem
            key={service.title}
            title={service.title}
            description={service.description}
          />
        ))}

        {services.pricing ? (
          <TextListItem
            title={services.pricing.title}
            description={services.pricing.description}
          />
        ) : null}
      </TextList>
    </Section>
  );
}
