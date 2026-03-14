export interface GitHubConfig {
  pat: string;
  owner: string;
  repo: string;
  branch: string; // default "main"
}

const BASE = 'https://api.github.com';

function headers(pat: string) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function repoUrl(config: GitHubConfig, path: string) {
  return `${BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
}

async function checkStatus(res: Response, context: string): Promise<void> {
  if (res.ok) return;
  if (res.status === 401) throw new Error('Bad PAT — authentication failed (401).');
  if (res.status === 404) throw new Error(`Not found (404): ${context}`);
  if (res.status === 409) throw new Error(`SHA conflict (409): ${context} — please retry.`);
  let msg = `GitHub API error ${res.status}: ${context}`;
  try {
    const body = await res.json();
    if (body?.message) msg += ` — ${body.message}`;
  } catch { /* ignore */ }
  throw new Error(msg);
}

/** Returns parsed data + SHA for read-modify-write. Returns null if file doesn't exist yet. */
export async function getJsonFile<T>(
  config: GitHubConfig,
  path: string,
  forceLoad: boolean = false,
): Promise<{ data: T; sha: string } | null> {
  const res = forceLoad ? await fetch(
      `${repoUrl(config, path)}?ref=${config.branch}`,
      { headers: headers(config.pat), cache: 'no-cache' },
    )
    : await fetch(
      `${repoUrl(config, path)}?ref=${config.branch}`,
      { headers: headers(config.pat) },
    );

  if (res.status === 404) return null;
  await checkStatus(res, path);
  const json = await res.json();
  const sha: string = json.sha;

  let content: string;
  if (json.content) {
    // Standard response — base64 with possible newlines
    content = atob(json.content.replace(/\n/g, ''));
  } else if (json.download_url) {
    // File > 1 MB — content truncated; fall back to download_url
    const dlRes = await fetch(json.download_url);
    if (!dlRes.ok) throw new Error(`Failed to fetch download_url for ${path}`);
    content = await dlRes.text();
  } else {
    throw new Error(`Unexpected GitHub response for ${path}`);
  }

  return { data: JSON.parse(content) as T, sha };
}

/** Create or update a file. sha required only when updating an existing file. */
export async function putFile(
  config: GitHubConfig,
  path: string,
  base64Content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: base64Content,
    branch: config.branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(repoUrl(config, path), {
    method: 'PUT',
    headers: headers(config.pat),
    body: JSON.stringify(body),
  });
  await checkStatus(res, path);
}

/** Delete a file. SHA is required (fetch it first with getFile). */
export async function deleteFile(
  config: GitHubConfig,
  path: string,
  sha: string,
  message: string,
): Promise<void> {
  const res = await fetch(repoUrl(config, path), {
    method: 'DELETE',
    headers: headers(config.pat),
    body: JSON.stringify({ message, sha, branch: config.branch }),
  });
  await checkStatus(res, path);
}

/** Get the SHA of a file without fetching its content. Returns null if not found. */
export async function getFileSha(
  config: GitHubConfig,
  path: string,
): Promise<string | null> {
  const res = await fetch(
    `${repoUrl(config, path)}?ref=${config.branch}`,
    { headers: headers(config.pat) },
  );
  if (res.status === 404) return null;
  await checkStatus(res, path);
  const json = await res.json();
  return json.sha as string;
}

/** Fetch a photo file → returns "data:image/jpeg;base64,..." for use in <img src> */
export async function fetchPhotoDataUrl(
  config: GitHubConfig,
  path: string,
): Promise<string> {
  const res = await fetch(
    `${repoUrl(config, path)}?ref=${config.branch}`,
    { headers: headers(config.pat) },
  );
  await checkStatus(res, path);
  const json = await res.json();

  let base64: string;
  if (json.content) {
    base64 = json.content.replace(/\n/g, '');
  } else if (json.download_url) {
    // Fetch raw bytes and encode manually
    const dlRes = await fetch(json.download_url);
    if (!dlRes.ok) throw new Error(`Failed to fetch photo download_url for ${path}`);
    const buffer = await dlRes.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    base64 = btoa(binary);
  } else {
    throw new Error(`Unexpected GitHub response for photo ${path}`);
  }

  return `data:image/jpeg;base64,${base64}`;
}

/** Returns null on success, error message string on failure */
export async function testConnection(config: GitHubConfig): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE}/repos/${config.owner}/${config.repo}`,
      { headers: headers(config.pat) },
    );
    if (res.status === 401) return 'Bad PAT — authentication failed.';
    if (res.status === 404) return `Repo "${config.owner}/${config.repo}" not found (or PAT lacks access).`;
    if (!res.ok) return `GitHub error ${res.status}.`;
    return null;
  } catch (err) {
    return `Network error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
