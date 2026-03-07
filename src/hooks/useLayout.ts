import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import type { GardenBed, BedFormData, PlantingFormData, Planting } from '@/types/layout';
import type { PlantType } from '@/types/plantType';
import {
  getBeds,
  createBed,
  updateBed,
  deleteBed,
  addPlanting,
  updatePlanting,
  deletePlanting,
  movePlanting as storageMoveePlanting,
  findPlacement,
  insertPlanting,
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
      console.log(`📊 Loaded ${loaded.length} beds:`);
      loaded.forEach((bed, index) => {
        console.log(`  ${index + 1}. "${bed.name}": ${bed.plantings.length} plantings`);
      });
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
              height: data.width,
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
    
    // Retry logic for SHA conflicts
    let retries = 3;
    while (retries > 0) {
      try {
        await deletePlanting(config, bedId, plantingId);
        return; // Success, exit the retry loop
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        if (errorMessage.includes('SHA conflict') && retries > 1) {
          console.log(`SHA conflict detected, retrying... (${4 - retries}/3)`);
          retries--;
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        // If it's not a SHA conflict or we're out of retries, handle the error
        console.error(`Failed to delete planting after retries:`, errorMessage);
        setError(errorMessage);
        await loadBeds(config); // Reload to get correct state
        break;
      }
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

  async function addPlantingFromType(bedId: string, plantType: PlantType) {
    if (!config) return;
    const bed = beds.find((b) => b.id === bedId);
    if (!bed) return;
    const { row, col } = findPlacement(bed, plantType.year, plantType.width);
    const planting: Planting = {
      id: uuidv4(),
      bedId,
      year: plantType.year,
      row,
      col,
      width: plantType.width,
      height: plantType.width,
      plantName: plantType.plantName,
      color: plantType.color,
    };
    // Optimistic update
    setBeds((prev) =>
      prev.map((b) =>
        b.id !== bedId ? b : { ...b, plantings: [...b.plantings, planting] },
      ),
    );
    setError(null);
    try {
      await insertPlanting(config, planting);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
    addPlantingFromType,
    loadBeds: (cfg: GitHubConfig) => loadBeds(cfg),
  };
}
