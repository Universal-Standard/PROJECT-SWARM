interface GitHubReviewFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string | null;
}

interface GitHubReviewCommit {
  sha: string;
  message: string;
}

interface GitHubReviewPromptInput {
  repositoryFullName: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  pullRequestBody?: string | null;
  baseBranch: string;
  headBranch: string;
  files: GitHubReviewFile[];
  commits: GitHubReviewCommit[];
  additionalContext?: string;
}

const MAX_FILES = 20;
const MAX_PATCH_LENGTH = 1200;

function truncatePatch(patch: string): string {
  if (patch.length <= MAX_PATCH_LENGTH) {
    return patch;
  }

  return `${patch.slice(0, MAX_PATCH_LENGTH)}\n... [patch truncated]`;
}

export function buildGitHubReviewPrompt(input: GitHubReviewPromptInput): string {
  const fileSummaries = input.files.slice(0, MAX_FILES).map((file) => {
    const patch = file.patch ? `\nPatch:\n${truncatePatch(file.patch)}` : "";

    return [
      `File: ${file.filename}`,
      `Status: ${file.status}`,
      `Additions: ${file.additions}`,
      `Deletions: ${file.deletions}${patch}`,
    ].join("\n");
  });

  const commitSummaries = input.commits
    .slice(0, 10)
    .map((commit) => `- ${commit.sha.slice(0, 7)} ${commit.message}`);

  return `Review the following GitHub pull request and provide a concise, high-signal code review.

Repository: ${input.repositoryFullName}
Pull Request: #${input.pullRequestNumber} ${input.pullRequestTitle}
Base Branch: ${input.baseBranch}
Head Branch: ${input.headBranch}

PR Description:
${input.pullRequestBody?.trim() || "No description provided."}

Recent Commits:
${commitSummaries.length > 0 ? commitSummaries.join("\n") : "- No commit metadata available."}

Changed Files:
${fileSummaries.length > 0 ? fileSummaries.join("\n\n---\n\n") : "No changed files were returned."}

Additional Context:
${input.additionalContext?.trim() || "None."}

Instructions:
- Focus on correctness, regressions, security, and missing edge-case handling.
- Ignore style-only nits unless they hide a defect.
- If there are no material issues, explicitly say LGTM.
- Return markdown with these sections:
  1. Summary
  2. Findings
  3. Recommended Next Step
- In Findings, use bullet points and reference file paths when possible.`;
}
