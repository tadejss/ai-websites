import { formatCardTitle } from "@/content/format-titled-item";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextList, TextListItem } from "@/components/ui/TextListItem";
import { TradeSection } from "./TradeSection";
import { resolveTradeLayoutFromConfig } from "./trade-layout";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function TradeBenefitsSection({ siteConfig }: Props) {
  const { whyChooseUs } = siteConfig;
  const layout = resolveTradeLayoutFromConfig(siteConfig);

  return (
    <TradeSection id={whyChooseUs.id} sectionRule={layout.sectionRule}>
      <SectionHeading
        variant="trade"
        eyebrow={whyChooseUs.eyebrow}
        title={whyChooseUs.title}
        description={whyChooseUs.description}
      />

      <TextList variant="trade" className="mx-auto mt-16 max-w-2xl space-y-12">
        {whyChooseUs.benefits.map((benefit) => {
          const title = formatCardTitle(benefit);

          return (
            <TextListItem
              key={title}
              variant="trade"
              title={title}
              description={benefit.description}
            />
          );
        })}
      </TextList>
    </TradeSection>
  );
}
