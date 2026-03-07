import { useState, useEffect } from 'react';
import type { GitHubConfig } from '@/lib/github';
import type { PlantType, PlantTypeFormData } from '@/types/plantType';
import { getPlantTypes, savePlantType, updatePlantType, deletePlantType } from '@/lib/plantTypeStorage';

export function usePlantTypes(config: GitHubConfig | null) {
  const [plantTypes, setPlantTypes] = useState<PlantType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTypes(cfg: GitHubConfig) {
    setIsLoading(true);
    setError(null);
    try {
      setPlantTypes(await getPlantTypes(cfg));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!config) { setPlantTypes([]); return; }
    loadTypes(config);
  }, [config]);

  async function addPlantType(data: PlantTypeFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      const pt = await savePlantType(config, data);
      setPlantTypes((prev) => [...prev, pt]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function editPlantType(id: string, data: PlantTypeFormData) {
    if (!config) return;
    // Optimistic update
    setPlantTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    );
    setError(null);
    try {
      await updatePlantType(config, id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await loadTypes(config);
    }
  }

  async function removePlantType(id: string) {
    if (!config) return;
    setPlantTypes((prev) => prev.filter((t) => t.id !== id));
    setError(null);
    try {
      await deletePlantType(config, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await loadTypes(config);
    }
  }

  return { plantTypes, isLoading, isMutating, error, addPlantType, editPlantType, removePlantType };
}
