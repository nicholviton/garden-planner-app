import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile } from '@/lib/github';
import type { GardenBed, BedFormData, PlantingFormData, Planting } from '@/types/layout';
import { DEFAULT_SEASON_ID } from '@/types/season';

const LAYOUT_PATH = 'layout.json';

function layoutPathForSeason(seasonId: string): string {
  return `seasons/${seasonId}/layout.json`;
}

function isDefaultSeason(seasonId: string): boolean {
  return seasonId === DEFAULT_SEASON_ID;
}

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

async function readBeds(
  config: GitHubConfig,
  seasonId: string = DEFAULT_SEASON_ID,
  forceLoad: boolean = false,
): Promise<{ beds: GardenBed[]; sha?: string; path: string }> {
  const seasonPath = layoutPathForSeason(seasonId);
  const seasonData = await getJsonFile<GardenBed[]>(config, seasonPath, forceLoad);
  if (seasonData) return { beds: seasonData.data, sha: seasonData.sha, path: seasonPath };

  if (isDefaultSeason(seasonId)) {
    const legacy = await getJsonFile<GardenBed[]>(config, LAYOUT_PATH, forceLoad);
    if (legacy) return { beds: legacy.data, sha: legacy.sha, path: LAYOUT_PATH };
  }

  return { beds: [], path: seasonPath };
}

async function writeBeds(config: GitHubConfig, seasonId: string, beds: GardenBed[], sha?: string): Promise<void> {
  await putFile(config, layoutPathForSeason(seasonId), jsonToBase64(beds), 'Update garden layout', sha);
}

export async function getBeds(config: GitHubConfig, seasonId: string = DEFAULT_SEASON_ID, forceLoad: boolean = false): Promise<GardenBed[]> {
  const { beds } = await readBeds(config, seasonId, forceLoad);
  return beds;
}

export async function overwriteBeds(config: GitHubConfig, beds: GardenBed[], seasonId: string = DEFAULT_SEASON_ID): Promise<void> {
  const { sha } = await readBeds(config, seasonId);
  await writeBeds(config, seasonId, beds, sha);
}

export async function createBed(config: GitHubConfig, formData: BedFormData, seasonId: string = DEFAULT_SEASON_ID): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  const now = new Date().toISOString();
  const bed: GardenBed = {
    id: uuidv4(),
    name: formData.name,
    widthIn: formData.widthIn,
    heightIn: formData.heightIn,
    plantings: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeBeds(config, seasonId, [...beds, bed], sha);
  return bed;
}

export async function updateBed(
  config: GitHubConfig,
  id: string,
  formData: BedFormData,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id === id) {
      updated = { ...b, name: formData.name, widthIn: formData.widthIn, heightIn: formData.heightIn, updatedAt: new Date().toISOString() };
      return updated;
    }
    return b;
  });
  if (!updated) throw new Error(`Bed ${id} not found`);
  await writeBeds(config, seasonId, newBeds, sha);
  return updated;
}

export async function movePlanting(
  config: GitHubConfig,
  bedId: string,
  plantingId: string,
  newRow: number,
  newCol: number,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id !== bedId) return b;
    const newPlantings = b.plantings.map((p) =>
      p.id === plantingId ? { ...p, row: newRow, col: newCol } : p,
    );
    updated = { ...b, plantings: newPlantings, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error(`Bed ${bedId} not found`);
  await writeBeds(config, seasonId, newBeds, sha);
  return updated;
}

export async function deleteBed(config: GitHubConfig, id: string, seasonId: string = DEFAULT_SEASON_ID): Promise<void> {
  const { beds, sha } = await readBeds(config, seasonId);
  const filtered = beds.filter((b) => b.id !== id);
  await writeBeds(config, seasonId, filtered, sha);
}

export async function addPlanting(
  config: GitHubConfig,
  bedId: string,
  year: number,
  data: PlantingFormData,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  const planting: Planting = {
    id: uuidv4(),
    bedId,
    year,
    row: data.row,
    col: data.col,
    width: data.width,
    height: data.width,   // circle: height always equals width
    plantName: data.plantName,
    color: data.color,
    ...(data.sowDate ? { sowDate: data.sowDate } : {}),
    ...(data.harvestDate ? { harvestDate: data.harvestDate } : {}),
    ...(data.daysToHarvest.trim() !== '' ? { daysToHarvest: parseInt(data.daysToHarvest) } : {}),
  };
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id === bedId) {
      updated = { ...b, plantings: [...b.plantings, planting], updatedAt: new Date().toISOString() };
      return updated;
    }
    return b;
  });
  if (!updated) throw new Error(`Bed ${bedId} not found`);
  await writeBeds(config, seasonId, newBeds, sha);
  return updated;
}

export async function updatePlanting(
  config: GitHubConfig,
  bedId: string,
  plantingId: string,
  data: PlantingFormData,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id !== bedId) return b;
    const newPlantings = b.plantings.map((p) => {
      if (p.id !== plantingId) return p;
      return {
        ...p,
        plantName: data.plantName,
        color: data.color,
        width: data.width,
        height: data.width,   // circle: height always equals width
        sowDate: data.sowDate || undefined,
        harvestDate: data.harvestDate || undefined,
        daysToHarvest: data.daysToHarvest.trim() !== '' ? parseInt(data.daysToHarvest) : undefined,
      };
    });
    updated = { ...b, plantings: newPlantings, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error(`Bed ${bedId} not found`);
  await writeBeds(config, seasonId, newBeds, sha);
  return updated;
}

/** Scan row-major for the first clear (size × size) area in the given year. Falls back to (0, 0). */
export function findPlacement(bed: GardenBed, year: number, size: number): { row: number; col: number } {
  const cols = bed.widthIn;
  const rows = bed.heightIn;
  const yearPlantings = bed.plantings.filter((p) => p.year === year);

  for (let r = 0; r <= rows - size; r++) {
    for (let c = 0; c <= cols - size; c++) {
      const blocked = yearPlantings.some(
        (p) =>
          r < p.row + p.height && r + size > p.row &&
          c < p.col + p.width  && c + size > p.col,
      );
      if (!blocked) 
        return { row: r, col: c };
    }
  }
  return { row: 0, col: 0 };
}

export async function insertPlanting(
  config: GitHubConfig,
  planting: Planting,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id !== planting.bedId) return b;
    updated = { ...b, plantings: [...b.plantings, planting], updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error(`Bed ${planting.bedId} not found`);
  await writeBeds(config, seasonId, newBeds, sha);
  return updated;
}

export async function deletePlanting(
  config: GitHubConfig,
  bedId: string,
  plantingId: string,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config, seasonId);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id !== bedId) return b;
    updated = { ...b, plantings: b.plantings.filter((p) => p.id !== plantingId), updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error(`Bed ${bedId} not found`);
  await writeBeds(config, seasonId, newBeds, sha);
  return updated;
}
