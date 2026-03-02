import { createContext, useContext } from 'react';
import type { GitHubConfig } from '@/lib/github';

export const GitHubConfigContext = createContext<GitHubConfig | null>(null);

export function useGitHubConfig(): GitHubConfig | null {
  return useContext(GitHubConfigContext);
}
