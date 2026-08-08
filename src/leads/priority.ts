export const LEAD_PRIORITIES = ["A", "B", "C", "D"] as const;

export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export type LeadPriorityInput = {
  existingWebsite?: string;
  googleRating?: string;
  googleReviewCount?: string;
  phone?: string;
  address?: string;
};

const EXCEPTIONAL_RATING = 4.8;
const STRONG_RATING = 4.5;
const DECENT_RATING = 4.0;
const WEAK_RATING = 3.5;

const CONFIDENT_REVIEW_COUNT = 20;
const MEANINGFUL_REVIEW_COUNT = 5;

function parseNumber(value?: string): number | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function hasText(value?: string): boolean {
  return Boolean(value?.trim());
}

export function getLeadPriority(lead: LeadPriorityInput): LeadPriority {
  const rating = parseNumber(lead.googleRating);
  const reviewCount = parseNumber(lead.googleReviewCount) ?? 0;

  if (rating !== null && rating < WEAK_RATING) {
    return "D";
  }

  if (hasText(lead.existingWebsite)) {
    return rating === null ? "D" : "C";
  }

  if (rating === null) {
    return hasText(lead.phone) || hasText(lead.address) ? "C" : "D";
  }

  if (rating >= STRONG_RATING && reviewCount >= CONFIDENT_REVIEW_COUNT) {
    return "A";
  }

  if (rating >= EXCEPTIONAL_RATING && reviewCount >= MEANINGFUL_REVIEW_COUNT) {
    return "A";
  }

  if (rating >= STRONG_RATING) {
    return "B";
  }

  if (rating >= DECENT_RATING && reviewCount >= MEANINGFUL_REVIEW_COUNT) {
    return "B";
  }

  return "C";
}
