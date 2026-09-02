import {
  showcasePurchaseBarHeadline,
  showcasePurchaseBarSubtitle,
} from "../src/billing/owner-first-name";
import {
  isShowcaseReferenceSlug,
  SHOWCASE_REFERENCE_SLUGS,
} from "../src/billing/showcase-slugs";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("== showcase reference slugs ==");
assert(SHOWCASE_REFERENCE_SLUGS.length === 4, "expected 4 showcase slugs");
assert(
  isShowcaseReferenceSlug("frizerski-salon-luna"),
  "frizerski-salon-luna should be showcase",
);
assert(
  !isShowcaseReferenceSlug("studio-moj-frizer"),
  "factory demos should not be showcase",
);

console.log("== showcase purchase bar copy ==");
assert(
  showcasePurchaseBarHeadline() === "Taka stran je lahko vaša.",
  "showcase headline",
);
assert(
  showcasePurchaseBarSubtitle("yearly").includes("GRATIS DOMENA"),
  "showcase yearly subtitle",
);

console.log("\nAll showcase tests passed.");
