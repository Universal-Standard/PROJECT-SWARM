/**
 * GitHub-native storage for non-SQLite data:
 * - Knowledge base → GitHub Discussions
 * - Large outputs → GitHub Gists (private)
 * - Workflow snapshots → GitHub Releases
 */

const GITHUB_API = "https://api.github.com";
const OWNER = import.meta.env.VITE_GITHUB_OWNER || "";
const REPO  = import.meta.env.VITE_GITHUB_REPO  || "";
const GRAPHQL_API = "https://api.github.com/graphql";

function getToken(): string {
  const t = localStorage.getItem("github_token");
  if (!t) throw new Error("Not authenticated");
  return t;
}

function restHeaders() {
  return {
    Authorization: `token ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

// ─── Gists (large outputs) ────────────────────────────────────────────────────

export interface GistFile {
  filename: string;
  content: string;
}

/** GitHub API response shape for a single file in a Gist. */
interface GistFileData {
  filename: string;
  type: string;
  language: string | null;
  raw_url: string;
  size: number;
  content: string;
}

export async function createGist(
  description: string,
  files: GistFile[],
  isPublic = false
): Promise<string> {
  const filesObj: Record<string, { content: string }> = {};
  for (const f of files) {
    filesObj[f.filename] = { content: f.content };
  }
  const res = await fetch(`${GITHUB_API}/gists`, {
    method: "POST",
    headers: restHeaders(),
    body: JSON.stringify({ description, files: filesObj, public: isPublic }),
  });
  if (!res.ok) throw new Error(`Failed to create gist: ${await res.text()}`);
  const data = await res.json();
  return data.html_url as string;
}

export async function getGist(gistId: string): Promise<Record<string, string>> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: restHeaders(),
  });
  if (!res.ok) throw new Error(`Gist ${gistId} not found`);
  const data = await res.json() as { files: Record<string, GistFileData> };
  const files: Record<string, string> = {};
  for (const [name, file] of Object.entries(data.files)) {
    files[name] = file.content;
  }
  return files;
}

// ─── Releases (workflow snapshots / db backups) ───────────────────────────────

export async function createRelease(
  tag: string,
  name: string,
  body: string,
  assets: Array<{ filename: string; content: string; contentType?: string }>
): Promise<string> {
  // Create release
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/releases`, {
    method: "POST",
    headers: restHeaders(),
    body: JSON.stringify({ tag_name: tag, name, body, draft: false, prerelease: false }),
  });
  if (!res.ok) throw new Error(`Failed to create release: ${await res.text()}`);
  const release = await res.json();

  // Upload assets
  for (const asset of assets) {
    const uploadUrl = (release.upload_url as string).replace("{?name,label}", "");
    await fetch(`${uploadUrl}?name=${encodeURIComponent(asset.filename)}`, {
      method: "POST",
      headers: {
        ...restHeaders(),
        "Content-Type": asset.contentType || "application/octet-stream",
      },
      body: asset.content,
    });
  }

  return release.html_url as string;
}

export async function listReleases(): Promise<
  Array<{ id: number; tag: string; name: string; url: string; createdAt: string }>
> {
  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/releases?per_page=20`,
    { headers: restHeaders() }
  );
  const data = await res.json();
  return (data as any[]).map((r) => ({
    id: r.id,
    tag: r.tag_name,
    name: r.name,
    url: r.html_url,
    createdAt: r.created_at,
  }));
}

// ─── Discussions (knowledge base) ────────────────────────────────────────────

export interface KnowledgeEntry {
  id: string;
  agentType: string;
  category: string;
  content: string;
  title: string;
  url: string;
  createdAt: string;
}

interface DiscussionLabel { name: string; }

/** Extract the agent type from a discussion's label list (format: "agent:<type>"). */
function extractAgentTypeFromLabels(labels: DiscussionLabel[]): string {
  const agentLabel = labels.find((l) => l.name?.startsWith("agent:"));
  return agentLabel ? agentLabel.name.replace("agent:", "") : "unknown";
}

async function graphql(query: string, variables: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(GRAPHQL_API, {
    method: "POST",
    headers: {
      Authorization: `token ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json() as { data?: unknown; errors?: unknown[] };
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

interface DiscussionNode {
  id: string;
  number: number;
  title: string;
  body: string;
  url: string;
  createdAt: string;
  category: { name: string } | null;
  labels: { nodes: DiscussionLabel[] };
}

export async function listKnowledgeEntries(agentType?: string): Promise<KnowledgeEntry[]> {
  const data = await graphql(
    `query($owner: String!, $repo: String!, $first: Int!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: $first, categoryId: null, orderBy: { field: CREATED_AT, direction: DESC }) {
          nodes {
            id number title body url createdAt
            category { name }
            labels(first: 5) { nodes { name } }
          }
        }
      }
    }`,
    { owner: OWNER, repo: REPO, first: 50 }
  ) as { repository?: { discussions?: { nodes: DiscussionNode[] } } };

  const nodes = data?.repository?.discussions?.nodes ?? [];
  return nodes
    .filter((n) => !agentType || n.labels?.nodes?.some((l) => l.name === `agent:${agentType}`))
    .map((n) => ({
      id: n.id,
      agentType: extractAgentTypeFromLabels(n.labels?.nodes ?? []),
      category: n.category?.name ?? "general",
      content: n.body,
      title: n.title,
      url: n.url,
      createdAt: n.createdAt,
    }));
}

export async function createKnowledgeEntry(
  title: string,
  content: string,
  agentType: string,
  categoryId: string
): Promise<KnowledgeEntry> {
  const data = await graphql(
    `mutation($repoId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: { repositoryId: $repoId, categoryId: $categoryId, title: $title, body: $body }) {
        discussion { id title body url createdAt }
      }
    }`,
    {
      repoId: import.meta.env.VITE_GITHUB_REPO_NODE_ID || "",
      categoryId,
      title,
      body: content,
    }
  ) as any;

  const d = data?.createDiscussion?.discussion;
  return { id: d.id, agentType, category: "knowledge", content: d.body, title: d.title, url: d.url, createdAt: d.createdAt };
}
