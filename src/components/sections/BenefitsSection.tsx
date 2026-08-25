import { formatCardTitle } from "@/content/format-titled-item";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextList, TextListItem } from "@/components/ui/TextListItem";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  return (
    <Section id={whyChooseUs.id}>
      <SectionHeading
        eyebrow={whyChooseUs.eyebrow}
        title={whyChooseUs.title}
        description={whyChooseUs.description}
      />

      <TextList className="mx-auto mt-12 max-w-2xl space-y-10">
        {whyChooseUs.benefits.map((benefit) => {
          const title = formatCardTitle(benefit);

          return (
            <TextListItem
              key={title}
              title={title}
              description={benefit.description}
            />
          );
        })}
      </TextList>
    </Section>
  );
}
