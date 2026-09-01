import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFactoryWorkerConfig } from "./config";

const execFileAsync = promisify(execFile);

export type GitPublishResult =
  | {
      outcome: "published";
      commitSha: string;
      filesChanged: number;
    }
  | {
      outcome: "noop";
      reason: string;
    }
  | {
      outcome: "failed";
      error: string;
    };

export type GitPublishDependencies = {
  runGit: (args: string[]) => Promise<{ stdout: string; stderr: string }>;
  publishEnabled: boolean;
  gitRemote: string;
  gitBranch: string;
};

export async function defaultRunGit(
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync("git", args, {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}

export function countChangedFilesInPorcelain(porcelain: string): number {
  return porcelain
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

function logGitPublishNotice(
  message: string,
  data: Record<string, unknown>,
): void {
  console.log(`[git-publish] ${message}`, JSON.stringify(data));
  if (process.env.GITHUB_ACTIONS === "true") {
    console.log(`::notice::git-publish ${message} ${JSON.stringify(data)}`);
  }
}

async function countRevRange(
  runGit: GitPublishDependencies["runGit"],
  range: string,
): Promise<number> {
  const result = await runGit(["rev-list", "--count", range]);
  const parsed = Number.parseInt(result.stdout.trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Fetch latest target branch and rebase local commits on top so a long-running
 * worker can push after other commits landed on main during generation.
 */
async function syncRemoteBranchBeforePush(
  d: GitPublishDependencies,
  attempt = 1,
): Promise<void> {
  const upstream = `${d.gitRemote}/${d.gitBranch}`;
  await d.runGit([
    "fetch",
    d.gitRemote,
    `+refs/heads/${d.gitBranch}:refs/remotes/${d.gitRemote}/${d.gitBranch}`,
  ]);

  const behindBefore = await countRevRange(d.runGit, `HEAD..${upstream}`);
  const aheadBefore = await countRevRange(d.runGit, `${upstream}..HEAD`);
  logGitPublishNotice("remote sync state before rebase", {
    upstream,
    behindBefore,
    aheadBefore,
    attempt,
  });

  if (aheadBefore > 0) {
    await d.runGit(["rebase", upstream]);
    logGitPublishNotice("rebased onto remote branch", {
      upstream,
      behindBefore,
      aheadBefore,
      attempt,
    });
  }
}

async function pushWithRemoteSync(
  d: GitPublishDependencies,
  commitSha: string,
): Promise<void> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await syncRemoteBranchBeforePush(d, attempt);
      await d.runGit(["push", d.gitRemote, `HEAD:${d.gitBranch}`]);
      logGitPublishNotice("push succeeded", {
        commitSha,
        branch: d.gitBranch,
        remote: d.gitRemote,
        attempt,
      });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      logGitPublishNotice("push rejected; will retry after fetch/rebase", {
        attempt,
        maxAttempts,
        error: message.slice(0, 300),
      });
    }
  }

  throw lastError;
}

/**
 * Stage, commit, and push changes under the given repo-relative paths.
 */
export async function gitPublishPaths(
  input: {
    paths: readonly string[];
    commitMessage: string;
  },
  deps: Partial<GitPublishDependencies> = {},
): Promise<GitPublishResult> {
  const config = getFactoryWorkerConfig();
  const d: GitPublishDependencies = {
    runGit: defaultRunGit,
    publishEnabled: deps.publishEnabled ?? config.publishEnabled,
    gitRemote: deps.gitRemote ?? config.gitRemote,
    gitBranch: deps.gitBranch ?? config.gitBranch,
    ...deps,
  };

  const paths = [...input.paths];
  if (paths.length === 0) {
    return { outcome: "noop", reason: "No paths to publish" };
  }

  const status = await d.runGit(["status", "--porcelain", "--", ...paths]);
  const porcelain = status.stdout.trim();
  const filesChanged = countChangedFilesInPorcelain(porcelain);

  if (filesChanged === 0) {
    return { outcome: "noop", reason: "No changes under publish paths" };
  }

  if (!d.publishEnabled) {
    return {
      outcome: "noop",
      reason: "FACTORY_PUBLISH_ENABLED=false — changes not pushed",
    };
  }

  try {
    await d.runGit(["add", "--", ...paths]);

    const staged = await d.runGit([
      "diff",
      "--cached",
      "--name-only",
      "--",
      ...paths,
    ]);
    if (!staged.stdout.trim()) {
      return { outcome: "noop", reason: "Nothing staged after git add" };
    }

    await d.runGit(["commit", "-m", input.commitMessage]);

    const shaResult = await d.runGit(["rev-parse", "HEAD"]);
    const commitSha = shaResult.stdout.trim();

    await pushWithRemoteSync(d, commitSha);

    return { outcome: "published", commitSha, filesChanged };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logGitPublishNotice("publish failed", { error: message.slice(0, 500) });
    return { outcome: "failed", error: message };
  }
}
