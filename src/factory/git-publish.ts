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

    await d.runGit(["push", d.gitRemote, `HEAD:${d.gitBranch}`]);

    return { outcome: "published", commitSha, filesChanged };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { outcome: "failed", error: message };
  }
}
