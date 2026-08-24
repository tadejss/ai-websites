import type { AppearanceId } from "./types";

const BEAUTY_KEYWORDS =
  /friz|salon|lepot|nail|noht|lash|brow|kozmet|makeup|barber|hair|beauty|kozmetolog|nega\s+las|nega\s+kože/i;

const HEALTH_KEYWORDS =
  /masaž|masaz|spa|wellness|fizioterap|masažni|masazni|refleksolog|relaksacij/i;

const ELEKTRO_KEYWORDS =
  /elektro|električ|elektric|electrician|inštalater|instalater|ožičenj|ozicenj|razsvetlj|stikaln|elektroinštal|elektroinstal/i;

const AUTO_KEYWORDS =
  /vulkaniz|gumar|pnevmatik|tire|avtovulkan/i;

const CONSTRUCTION_KEYWORDS =
  /suhomontaž|suhomontaz|keramič|keramic|tile|tesar|krovec|klepar|fasader|mizar|zaključn|zakljucn|gradben|tlakov|mavč|mavc|estri|pardue|streš|stres/i;

const CLEANING_KEYWORDS =
  /čistil|cistil|čiščenj|ciscenj|cleaning|higien|higienič|higienic/i;

export function appearanceForIndustry(industry: string): AppearanceId {
  if (BEAUTY_KEYWORDS.test(industry)) {
    return "beauty";
  }

  if (HEALTH_KEYWORDS.test(industry)) {
    return "health";
  }

  if (ELEKTRO_KEYWORDS.test(industry)) {
    return "elektro";
  }

  if (AUTO_KEYWORDS.test(industry)) {
    return "auto";
  }

  if (CONSTRUCTION_KEYWORDS.test(industry)) {
    return "construction";
  }

  if (CLEANING_KEYWORDS.test(industry)) {
    return "cleaning";
  }

  return "default";
}
