import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextList, TextListItem } from "@/components/ui/TextListItem";
import { formatCardTitle } from "@/content/format-titled-item";
import type { SiteConfig } from "@/content/types/site";
import {
  getWhyChooseUsStepDescription,
  getWhyChooseUsStepTitle,
} from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyBenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;

  return (
    <section
      id={whyChooseUs.id}
      className="bg-background px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          variant="beauty"
          eyebrow={whyChooseUs.eyebrow}
          title={whyChooseUs.title}
          description={whyChooseUs.description}
        />

        <TextList variant="beauty" className="mx-auto mt-14 max-w-2xl space-y-12">
          {whyChooseUs.benefits.map((benefit) => {
            const title = formatCardTitle(benefit);

            return (
              <TextListItem
                key={title}
                variant="beauty"
                title={title}
                description={benefit.description}
              />
            );
          })}
        </TextList>

        {whyChooseUs.steps ? (
          <div
            id={whyChooseUs.steps.id}
            className="mt-24 border-t border-border pt-24"
          >
            <SectionHeading
              variant="beauty"
              align="left"
              eyebrow={whyChooseUs.steps.eyebrow}
              title={whyChooseUs.steps.title}
            />

            <TextList variant="beauty" className="mt-12 space-y-10">
              {whyChooseUs.steps.items.map((item, index) => {
                const title = getWhyChooseUsStepTitle(item);

                return (
                  <TextListItem
                    key={title}
                    variant="beauty"
                    title={`${String(index + 1).padStart(2, "0")} ${title}`}
                    description={getWhyChooseUsStepDescription(item)}
                  />
                );
              })}
            </TextList>
          </div>
        ) : null}
      </div>
    </section>
  );
}
