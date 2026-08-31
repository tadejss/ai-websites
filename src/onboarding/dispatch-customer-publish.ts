import { getFactoryWorkerConfig } from "@/factory/config";

export type CustomerPublishDispatchResult =
  | { ok: true; dispatched: true; status: number }
  | { ok: true; dispatched: false; reason: string }
  | { ok: false; error: string };

/**
 * Trigger customer-publish GitHub Actions workflow via repository_dispatch.
 */
export async function dispatchCustomerPublish(input: {
  slug: string;
  reason?: string;
}): Promise<CustomerPublishDispatchResult> {
  const config = getFactoryWorkerConfig();

  if (!config.dispatchEnabled) {
    return {
      ok: true,
      dispatched: false,
      reason: "FACTORY_DISPATCH_ENABLED is not true",
    };
  }

  if (!config.githubRepo || !config.githubToken) {
    return {
      ok: true,
      dispatched: false,
      reason: "FACTORY_GITHUB_REPO / FACTORY_GITHUB_TOKEN not configured",
    };
  }

  const [owner, repo] = config.githubRepo.split("/");
  if (!owner || !repo) {
    return { ok: false, error: "FACTORY_GITHUB_REPO must be owner/repo" };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${config.githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "customer-publish",
          client_payload: {
            slug: input.slug,
            reason: input.reason ?? "admin_approve",
          },
        }),
      },
    );

    if (response.status === 204 || response.ok) {
      return { ok: true, dispatched: true, status: response.status };
    }

    const body = await response.text();
    return {
      ok: false,
      error: `GitHub dispatch failed (${response.status}): ${body.slice(0, 300)}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
