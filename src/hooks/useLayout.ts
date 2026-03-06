import { useState, useEffect } from 'react';
import type { GitHubConfig } from '@/lib/github';
import type { GardenBed, BedFormData, PlantingFormData } from '@/types/layout';
import {
  getBeds,
  createBed,
  updateBed,
  deleteBed,
  addPlanting,
  updatePlanting,
  deletePlanting,
  movePlanting as storageMoveePlanting,
} from '@/lib/layoutStorage';

export function useLayout(config: GitHubConfig | null) {
  const [beds, setBeds] = useState<GardenBed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  async function loadBeds(cfg: GitHubConfig) {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getBeds(cfg);
      setBeds(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!config) {
      setBeds([]);
      return;
    }
    loadBeds(config);
  }, [config]);

  async function addBed(formData: BedFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await createBed(config, formData);
      await loadBeds(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function editBed(id: string, formData: BedFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await updateBed(config, id, formData);
      await loadBeds(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function removeBed(id: string) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await deleteBed(config, id);
      await loadBeds(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function savePlanting(bedId: string, row: number, col: number, data: PlantingFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await addPlanting(config, bedId, row, col, selectedYear, data);
      await loadBeds(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function editPlanting(bedId: string, plantingId: string, data: PlantingFormData) {
    if (!config) return;
    // Optimistic update — same pattern as movePlanting
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        return {
          ...b,
          plantings: b.plantings.map((p) =>
            p.id !== plantingId ? p : {
              ...p,
              plantName: data.plantName,
              color: data.color,
              width: data.width,
              height: data.height,
              sowDate: data.sowDate || undefined,
              harvestDate: data.harvestDate || undefined,
            },
          ),
        };
      }),
    );
    setError(null);
    try {
      await updatePlanting(config, bedId, plantingId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await loadBeds(config);
    }
  }

  async function removePlanting(bedId: string, plantingId: string) {
    if (!config) return;
    // Optimistic update
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        return { ...b, plantings: b.plantings.filter((p) => p.id !== plantingId) };
      }),
    );
    setError(null);
    try {
      await deletePlanting(config, bedId, plantingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await loadBeds(config);
    }
  }

  async function movePlanting(bedId: string, plantingId: string, newRow: number, newCol: number) {
    if (!config) return;
    // Optimistic update — instant visual response
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        return {
          ...b,
          plantings: b.plantings.map((p) =>
            p.id === plantingId ? { ...p, row: newRow, col: newCol } : p,
          ),
        };
      }),
    );
    setError(null);
    try {
      await storageMoveePlanting(config, bedId, plantingId, newRow, newCol);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // Reload true state on failure
      await loadBeds(config);
    }
  }

  return {
    beds,
    isLoading,
    isMutating,
    error,
    selectedYear,
    setSelectedYear,
    addBed,
    editBed,
    removeBed,
    savePlanting,
    editPlanting,
    removePlanting,
    movePlanting,
  };
}
