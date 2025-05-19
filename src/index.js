import * as core from "@actions/core";
import {
  getPRDiff,
  extractPRNumber,
  getRepoInfo,
  commentOnPR,
} from "./utils.js";
import { performAICodeReview } from "./use-reviewer.js";

async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const googleApiKey = process.env.GOOGLE_API_KEY;

    if (!githubToken) {
      throw new Error("GITHUB_TOKEN is required");
    }

    if (!googleApiKey) {
      throw new Error("GOOGLE_API_KEY is required");
    }

    const prNumber = extractPRNumber();
    const { owner, repo } = getRepoInfo();

    if (prNumber) {
      console.log(`PR number: ${prNumber}`);
    }

    const { diff } = await getPRDiff({
      token: githubToken,
      owner,
      repo,
      prNumber,
    });

    const reviewText = await performAICodeReview(diff, googleApiKey);

    if (prNumber) {
      await commentOnPR({
        token: githubToken,
        owner,
        repo,
        prNumber,
        body: `## AI Review Feedback:\n\n${reviewText}`,
      });
    } else {
      console.log("AI Review Feedback:");
      console.log(reviewText);
    }

    console.log("AI review completed successfully");
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
    console.error(error);
  }
}

run();
