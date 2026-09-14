import { describe, expect, it } from "vitest";
import { buildGitHubReviewPrompt } from "../github-review";

describe("buildGitHubReviewPrompt", () => {
  it("includes pull request metadata and review instructions", () => {
    const prompt = buildGitHubReviewPrompt({
      repositoryFullName: "octo/demo",
      pullRequestNumber: 42,
      pullRequestTitle: "Add repository editor",
      pullRequestBody: "Implements direct GitHub editing support.",
      baseBranch: "main",
      headBranch: "feature/repo-editor",
      files: [],
      commits: [{ sha: "abcdef123456", message: "feat: add editor" }],
      additionalContext: "Validate content-saving edge cases.",
    });

    expect(prompt).toContain("Repository: octo/demo");
    expect(prompt).toContain("Pull Request: #42 Add repository editor");
    expect(prompt).toContain("Base Branch: main");
    expect(prompt).toContain("Head Branch: feature/repo-editor");
    expect(prompt).toContain("Validate content-saving edge cases.");
    expect(prompt).toContain("Return markdown with these sections");
  });

  it("truncates oversized patches to keep prompts bounded", () => {
    const patch = "x".repeat(1400);
    const prompt = buildGitHubReviewPrompt({
      repositoryFullName: "octo/demo",
      pullRequestNumber: 7,
      pullRequestTitle: "Refactor integration",
      pullRequestBody: null,
      baseBranch: "main",
      headBranch: "refactor/github",
      files: [
        {
          filename: "src/index.ts",
          status: "modified",
          additions: 20,
          deletions: 10,
          patch,
        },
      ],
      commits: [],
    });

    expect(prompt).toContain("[patch truncated]");
    expect(prompt).not.toContain("x".repeat(1300));
  });
});
