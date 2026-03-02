import type { GitHubConfig } from '@/lib/github';

const CONFIG_KEY = 'garden_planner_github_config';

export function loadConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GitHubConfig>;
    if (parsed.pat && parsed.owner && parsed.repo) {
      return {
        pat: parsed.pat,
        owner: parsed.owner,
        repo: parsed.repo,
        branch: parsed.branch ?? 'main',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveConfig(config: GitHubConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}
