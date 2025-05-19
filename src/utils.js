import { getOctokit } from "@actions/github";
import * as core from "@actions/core";

export async function getPRDiff({ token, owner, repo, prNumber = null }) {
  const octokit = getOctokit(token);
  let diff;

  try {
    if (prNumber) {
      console.log(`Getting diff for PR #${prNumber}`);

      const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
          format: "diff",
        },
      });

      diff = response.data;
    } else {
      console.log(
        "Not a pull request event, fetching diff between HEAD^1 and HEAD"
      );

      const response = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base: "HEAD~1",
        head: "HEAD",
      });

      diff = response.data.files
        .map((file) => {
          return `diff --git a/${file.filename} b/${file.filename}
${file.patch || ""}`;
        })
        .join("\n");
    }

    return { diff, prNumber };
  } catch (error) {
    core.error(`Error getting PR diff: ${error.message}`);
    throw error;
  }
}

export function extractPRNumber() {
  const githubRef = process.env.GITHUB_REF || "";
  const isPR =
    process.env.GITHUB_EVENT_NAME === "pull_request" ||
    process.env.GITHUB_EVENT_NAME === "pull_request_target";

  if (isPR && githubRef.startsWith("refs/pull/")) {
    const prNumber = parseInt(githubRef.split("/")[2], 10);
    return prNumber;
  }

  return null;
}

export function getRepoInfo() {
  const repository = process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = repository.split("/");

  return { owner, repo };
}

export async function commentOnPR({ token, owner, repo, prNumber, body }) {
  if (!prNumber) {
    console.log("Not a PR, skipping comment");
    return;
  }

  const octokit = getOctokit(token);

  try {
    console.log(`Commenting on PR #${prNumber}`);
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
    console.log("Successfully posted comment on PR");
  } catch (error) {
    core.error(`Error commenting on PR: ${error.message}`);
    throw error;
  }
}
