import { getCustomerBySlug } from "@/customers/store";
import {
  defaultRunGit,
  gitPublishPaths,
  type GitPublishDependencies,
} from "@/factory/git-publish";
import { applyCustomerSite } from "./apply-customer-site";
import {
  claimCustomerPublishLease,
  releaseCustomerPublishLease,
} from "./publish-lease";
import {
  beginCustomerPublish,
  getOnboardingBySlug,
  markCustomerPublished,
  markCustomerPublishFailed,
} from "./store";

export type PublishCustomerResult =
  | {
      outcome: "live";
      slug: string;
      commitSha: string | null;
      alreadyLive: boolean;
    }
  | {
      outcome: "noop";
      slug: string;
      reason: string;
    }
  | {
      outcome: "failed";
      slug: string;
      error: string;
    }
  | {
      outcome: "busy";
      slug: string;
      reason: string;
    };

export type PublishCustomerOptions = {
  workerId?: string;
  leaseMinutes?: number;
  git?: Partial<GitPublishDependencies>;
};

function clientPublishPath(slug: string): string {
  return `src/content/clients/${slug}`;
}

/**
 * Apply onboarding payload, commit client content, push to git → Vercel deploy.
 * Idempotent when already live with no pending file changes.
 */
export async function publishCustomerSite(
  slug: string,
  options: PublishCustomerOptions = {},
): Promise<PublishCustomerResult> {
  const workerId =
    options.workerId?.trim() ||
    process.env.FACTORY_WORKER_ID?.trim() ||
    "customer-publish";

  const customer = await getCustomerBySlug(slug);
  if (!customer) {
    return { outcome: "failed", slug, error: "Customer not found" };
  }

  const onboarding = await getOnboardingBySlug(slug);
  if (!onboarding) {
    return { outcome: "failed", slug, error: "Onboarding not found" };
  }

  if (onboarding.status === "live") {
    return {
      outcome: "live",
      slug,
      commitSha: onboarding.publishCommitSha,
      alreadyLive: true,
    };
  }

  const publishable = [
    "approved_for_publish",
    "publish_failed",
    "publishing",
  ];
  if (!publishable.includes(onboarding.status)) {
    return {
      outcome: "failed",
      slug,
      error: `Onboarding status "${onboarding.status}" is not publishable`,
    };
  }

  if (!onboarding.processedPayload) {
    return {
      outcome: "failed",
      slug,
      error: "Missing processed_payload — run onboarding processing first",
    };
  }

  const lease = await claimCustomerPublishLease({
    slug,
    workerId,
    leaseMinutes: options.leaseMinutes,
  });

  if (!lease) {
    return {
      outcome: "busy",
      slug,
      reason: "Another publish run holds the lease for this slug",
    };
  }

  try {
    await beginCustomerPublish(slug);
    applyCustomerSite(
      slug,
      onboarding.processedPayload,
      onboarding.answers,
    );

    const publishPath = clientPublishPath(slug);
    const gitResult = await gitPublishPaths(
      {
        paths: [publishPath],
        commitMessage: [
          `customer: publish LIVE site for ${slug}`,
          "",
          "Applied onboarding payload to client content.",
        ].join("\n"),
      },
      options.git,
    );

    if (gitResult.outcome === "failed") {
      await markCustomerPublishFailed(slug, gitResult.error);
      return { outcome: "failed", slug, error: gitResult.error };
    }

    if (gitResult.outcome === "noop") {
      const runGit = options.git?.runGit ?? defaultRunGit;
      const shaResult = await runGit(["rev-parse", "HEAD"]);
      const commitSha = shaResult.stdout.trim();
      await markCustomerPublished(slug, commitSha);
      return {
        outcome: "live",
        slug,
        commitSha,
        alreadyLive: false,
      };
    }

    await markCustomerPublished(slug, gitResult.commitSha);
    return {
      outcome: "live",
      slug,
      commitSha: gitResult.commitSha,
      alreadyLive: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markCustomerPublishFailed(slug, message);
    return { outcome: "failed", slug, error: message };
  } finally {
    await releaseCustomerPublishLease(slug, lease.runId);
  }
}
