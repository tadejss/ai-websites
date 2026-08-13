import type { OutreachStep } from "@/leads/outreach-types";
import type { EmailTemplateContext } from "../build-context";
import { renderFollowup1Email } from "./followup-1";
import { renderFollowup2Email } from "./followup-2";
import { renderInitialEmail } from "./initial";

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderOutreachEmail(
  step: OutreachStep,
  ctx: EmailTemplateContext,
): RenderedEmail {
  switch (step) {
    case "initial":
      return renderInitialEmail(ctx);
    case "followup_1":
      return renderFollowup1Email(ctx);
    case "followup_2":
      return renderFollowup2Email(ctx);
  }
}
