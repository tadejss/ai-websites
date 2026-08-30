import type {
  CustomerOnboardingAnswers,
  OnboardingImage,
} from "./types";

/** Collect images from uploadedImages or legacy logoUrls/photoUrls arrays. */
export function listOnboardingImages(
  answers: CustomerOnboardingAnswers | null | undefined,
): OnboardingImage[] {
  if (!answers) {
    return [];
  }

  if (answers.uploadedImages?.length) {
    return answers.uploadedImages;
  }

  const logos: OnboardingImage[] = (answers.logoUrls ?? []).map((url) => ({
    url,
    kind: "logo" as const,
  }));
  const photos: OnboardingImage[] = (answers.photoUrls ?? []).map((url) => ({
    url,
    kind: "photo" as const,
  }));

  return [...logos, ...photos];
}

/** Keep legacy url arrays in sync with uploadedImages metadata. */
export function syncOnboardingImageFields(
  answers: CustomerOnboardingAnswers,
): CustomerOnboardingAnswers {
  const images = listOnboardingImages(answers);

  return {
    ...answers,
    uploadedImages: images,
    logoUrls: images.filter((img) => img.kind === "logo").map((img) => img.url),
    photoUrls: images.filter((img) => img.kind === "photo").map((img) => img.url),
  };
}

export function removeOnboardingImage(
  answers: CustomerOnboardingAnswers,
  url: string,
): CustomerOnboardingAnswers {
  const images = listOnboardingImages(answers).filter((img) => img.url !== url);
  return syncOnboardingImageFields({ ...answers, uploadedImages: images });
}

export function appendOnboardingImages(
  answers: CustomerOnboardingAnswers,
  newImages: OnboardingImage[],
): CustomerOnboardingAnswers {
  const existing = listOnboardingImages(answers);
  const merged = [...existing];

  for (const image of newImages) {
    if (!merged.some((item) => item.url === image.url)) {
      merged.push(image);
    }
  }

  return syncOnboardingImageFields({ ...answers, uploadedImages: merged });
}
