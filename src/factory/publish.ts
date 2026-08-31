import {
  countChangedFilesInPorcelain,
  defaultRunGit,
  gitPublishPaths,
  type GitPublishDependencies,
} from "./git-publish";
import { getFactoryWorkerConfig } from "./config";

const CONTENT_PATHS = [
  "src/content/leads",
  "src/content/clients",
] as const;

export type PublishResult =
  | {
      outcome: "published";
      commitSha: string;
      filesChanged: number;
      slugs: string[];
    }
  | {
      outcome: "noop";
      reason: string;
      slugs: string[];
    }
  | {
      outcome: "failed";
      error: string;
      slugs: string[];
    };

export type PublishDependencies = GitPublishDependencies;

export function extractGeneratedSlugs(porcelain: string): string[] {
  const slugs = new Set<string>();
  for (const line of porcelain.split("\n")) {
    const path = line.slice(3).trim().replace(/^"|"$/g, "");
    const match = path.match(
      /^src\/content\/(?:leads|clients)\/([^/]+)/,
    );
    if (match?.[1]) {
      slugs.add(match[1]!.replace(/\.json$/, ""));
    }
  }
  return [...slugs].sort();
}

export { countChangedFilesInPorcelain as countChangedFiles };

/**
 * Commit and push generated lead/client content. Marks publish success only
 * after a successful push. No-ops when there are no content changes.
 */
export async function publishGeneratedDemos(
  deps: Partial<PublishDependencies> = {},
): Promise<PublishResult> {
  const config = getFactoryWorkerConfig();
  const runGit = deps.runGit ?? defaultRunGit;
  const d: PublishDependencies = {
    runGit,
    publishEnabled: deps.publishEnabled ?? config.publishEnabled,
    gitRemote: deps.gitRemote ?? config.gitRemote,
    gitBranch: deps.gitBranch ?? config.gitBranch,
  };

  const status = await d.runGit([
    "status",
    "--porcelain",
    "--",
    ...CONTENT_PATHS,
  ]);
  const slugs = extractGeneratedSlugs(status.stdout.trim());

  const message = [
    "factory: replenish demo backlog",
    "",
    `Generated demos: ${slugs.length > 0 ? slugs.join(", ") : "(content updates)"}`,
  ].join("\n");

  const result = await gitPublishPaths(
    { paths: CONTENT_PATHS, commitMessage: message },
    d,
  );

  if (result.outcome === "published") {
    return {
      outcome: "published",
      commitSha: result.commitSha,
      filesChanged: result.filesChanged,
      slugs,
    };
  }

  if (result.outcome === "noop") {
    return { outcome: "noop", reason: result.reason, slugs };
  }

  return { outcome: "failed", error: result.error, slugs };
}
