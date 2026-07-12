import { useEffect, useState } from 'react';
import type { GitHubConfig } from '@/lib/github';
import type { Season } from '@/types/season';
import { buildDefaultSeason } from '@/types/season';
import { createSeason, getSeasons, reorderSeasons } from '@/lib/seasonStorage';

const SELECTED_SEASON_STORAGE_KEY = 'garden_planner_selected_season_id';

function readStoredSelectedSeasonId(): string | null {
  try {
    return localStorage.getItem(SELECTED_SEASON_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredSelectedSeasonId(seasonId: string): void {
  try {
    localStorage.setItem(SELECTED_SEASON_STORAGE_KEY, seasonId);
  } catch {
    // no-op
  }
}

export function useSeasons(config: GitHubConfig | null) {
  const [seasons, setSeasons] = useState<Season[]>([buildDefaultSeason()]);
  const [selectedSeasonId, setSelectedSeasonIdState] = useState<string>(() => readStoredSelectedSeasonId() ?? buildDefaultSeason().id);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) {
      const fallback = [buildDefaultSeason()];
      setSeasons(fallback);
      const selected = readStoredSelectedSeasonId() ?? fallback[0].id;
      const valid = fallback.some((season) => season.id === selected) ? selected : fallback[0].id;
      setSelectedSeasonIdState(valid);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getSeasons(config)
      .then((loaded) => {
        if (cancelled) return;
        const resolved = loaded.length > 0 ? loaded : [buildDefaultSeason()];
        setSeasons(resolved);

        const stored = readStoredSelectedSeasonId();
        const defaultId = resolved[0].id;
        const nextSelected = stored && resolved.some((season) => season.id === stored) ? stored : defaultId;
        setSelectedSeasonIdState(nextSelected);
        writeStoredSelectedSeasonId(nextSelected);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  function setSelectedSeasonId(seasonId: string) {
    setSelectedSeasonIdState(seasonId);
    writeStoredSelectedSeasonId(seasonId);
  }

  async function addSeason(name: string): Promise<boolean> {
    if (!config) return false;
    setIsMutating(true);
    setError(null);
    try {
      const created = await createSeason(config, name);
      const loaded = await getSeasons(config, true);
      setSeasons(loaded);
      setSelectedSeasonId(created.id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function moveSeason(seasonId: string, direction: 'up' | 'down'): Promise<boolean> {
    if (!config) return false;
    const currentIndex = seasons.findIndex((season) => season.id === seasonId);
    if (currentIndex < 0) return false;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= seasons.length) return false;

    const reordered = [...seasons];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setIsMutating(true);
    setError(null);
    try {
      const updated = await reorderSeasons(config, reordered.map((season) => season.id));
      setSeasons(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  return {
    seasons,
    selectedSeasonId,
    selectedSeason: seasons.find((season) => season.id === selectedSeasonId) ?? seasons[0],
    isLoading,
    isMutating,
    error,
    setSelectedSeasonId,
    addSeason,
    moveSeason,
  };
}
