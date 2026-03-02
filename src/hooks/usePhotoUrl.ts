import { useState, useEffect } from 'react';
import type { GitHubConfig } from '@/lib/github';
import { fetchPhotoDataUrl } from '@/lib/github';

// Module-level cache — survives re-renders
const photoCache = new Map<string, string>();

export function usePhotoUrl(
  config: GitHubConfig | null,
  path: string | undefined,
): { dataUrl: string | undefined; isLoading: boolean } {
  const cacheKey = path ?? '';
  const cached = path ? photoCache.get(cacheKey) : undefined;

  const [dataUrl, setDataUrl] = useState<string | undefined>(cached);
  const [isLoading, setIsLoading] = useState(!cached && !!path);

  useEffect(() => {
    if (!path || !config) {
      setDataUrl(undefined);
      setIsLoading(false);
      return;
    }
    const hit = photoCache.get(path);
    if (hit) {
      setDataUrl(hit);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchPhotoDataUrl(config, path)
      .then((url) => {
        if (cancelled) return;
        photoCache.set(path, url);
        setDataUrl(url);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [config, path]);

  return { dataUrl, isLoading };
}
