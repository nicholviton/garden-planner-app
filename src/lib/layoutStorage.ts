import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile } from '@/lib/github';
import type { GardenBed, BedFormData, PlantingFormData, Planting } from '@/types/layout';

const LAYOUT_PATH = 'layout.json';

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

async function readBeds(config: GitHubConfig): Promise<{ beds: GardenBed[]; sha?: string }> {
  const result = await getJsonFile<GardenBed[]>(config, LAYOUT_PATH);
  if (!result) return { beds: [] };
  return { beds: result.data, sha: result.sha };
}

async function writeBeds(config: GitHubConfig, beds: GardenBed[], sha?: string): Promise<void> {
  await putFile(config, LAYOUT_PATH, jsonToBase64(beds), 'Update garden layout', sha);
}

export async function getBeds(config: GitHubConfig): Promise<GardenBed[]> {
  const { beds } = await readBeds(config);
  return beds;
}

export async function createBed(config: GitHubConfig, formData: BedFormData): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config);
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
  await writeBeds(config, [...beds, bed], sha);
  return bed;
}

export async function updateBed(
  config: GitHubConfig,
  id: string,
  formData: BedFormData,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id === id) {
      updated = { ...b, name: formData.name, widthIn: formData.widthIn, heightIn: formData.heightIn, updatedAt: new Date().toISOString() };
      return updated;
    }
    return b;
  });
  if (!updated) throw new Error(`Bed ${id} not found`);
  await writeBeds(config, newBeds, sha);
  return updated;
}

export async function deleteBed(config: GitHubConfig, id: string): Promise<void> {
  const { beds, sha } = await readBeds(config);
  const filtered = beds.filter((b) => b.id !== id);
  await writeBeds(config, filtered, sha);
}

export async function addPlanting(
  config: GitHubConfig,
  bedId: string,
  row: number,
  col: number,
  year: number,
  data: PlantingFormData,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config);
  const planting: Planting = {
    id: uuidv4(),
    bedId,
    year,
    row,
    col,
    width: data.width,
    height: data.height,
    plantName: data.plantName,
    ...(data.sowDate ? { sowDate: data.sowDate } : {}),
    ...(data.harvestDate ? { harvestDate: data.harvestDate } : {}),
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
  await writeBeds(config, newBeds, sha);
  return updated;
}

export async function updatePlanting(
  config: GitHubConfig,
  bedId: string,
  plantingId: string,
  data: PlantingFormData,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id !== bedId) return b;
    const newPlantings = b.plantings.map((p) => {
      if (p.id !== plantingId) return p;
      return {
        ...p,
        plantName: data.plantName,
        width: data.width,
        height: data.height,
        sowDate: data.sowDate || undefined,
        harvestDate: data.harvestDate || undefined,
      };
    });
    updated = { ...b, plantings: newPlantings, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error(`Bed ${bedId} not found`);
  await writeBeds(config, newBeds, sha);
  return updated;
}

export async function deletePlanting(
  config: GitHubConfig,
  bedId: string,
  plantingId: string,
): Promise<GardenBed> {
  const { beds, sha } = await readBeds(config);
  let updated: GardenBed | undefined;
  const newBeds = beds.map((b) => {
    if (b.id !== bedId) return b;
    updated = { ...b, plantings: b.plantings.filter((p) => p.id !== plantingId), updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) throw new Error(`Bed ${bedId} not found`);
  await writeBeds(config, newBeds, sha);
  return updated;
}
