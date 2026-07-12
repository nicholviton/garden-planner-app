import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile } from '@/lib/github';
import type { PlantType, PlantTypeFormData } from '@/types/plantType';
import { DEFAULT_SEASON_ID } from '@/types/season';

const PLANT_TYPES_PATH = 'plant-types.json';

function plantTypesPathForSeason(seasonId: string): string {
  return `seasons/${seasonId}/plant-types.json`;
}

function isDefaultSeason(seasonId: string): boolean {
  return seasonId === DEFAULT_SEASON_ID;
}

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

async function readTypes(
  config: GitHubConfig,
  seasonId: string = DEFAULT_SEASON_ID,
  forceLoad: boolean = false,
): Promise<{ types: PlantType[]; sha?: string; path: string }> {
  const seasonPath = plantTypesPathForSeason(seasonId);
  const seasonData = await getJsonFile<PlantType[]>(config, seasonPath, forceLoad);
  if (seasonData) return { types: seasonData.data, sha: seasonData.sha, path: seasonPath };

  if (isDefaultSeason(seasonId)) {
    const legacy = await getJsonFile<PlantType[]>(config, PLANT_TYPES_PATH, forceLoad);
    if (legacy) return { types: legacy.data, sha: legacy.sha, path: PLANT_TYPES_PATH };
  }

  return { types: [], path: seasonPath };
}

async function writeTypes(config: GitHubConfig, seasonId: string, types: PlantType[], sha?: string): Promise<void> {
  await putFile(config, plantTypesPathForSeason(seasonId), jsonToBase64(types), 'Update plant types', sha);
}

export async function getPlantTypes(config: GitHubConfig, seasonId: string = DEFAULT_SEASON_ID, forceLoad: boolean = false): Promise<PlantType[]> {
  const { types } = await readTypes(config, seasonId, forceLoad);
  return types;
}

export async function overwritePlantTypes(config: GitHubConfig, types: PlantType[], seasonId: string = DEFAULT_SEASON_ID): Promise<void> {
  const { sha } = await readTypes(config, seasonId);
  await writeTypes(config, seasonId, types, sha);
}

export async function savePlantType(config: GitHubConfig, data: PlantTypeFormData, seasonId: string = DEFAULT_SEASON_ID): Promise<PlantType> {
  const { types, sha } = await readTypes(config, seasonId);
  const pt: PlantType = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
  await writeTypes(config, seasonId, [...types, pt], sha);
  return pt;
}

export async function updatePlantType(
  config: GitHubConfig,
  id: string,
  data: PlantTypeFormData,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<PlantType> {
  const { types, sha } = await readTypes(config, seasonId);
  let updated: PlantType | undefined;
  const newTypes = types.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, ...data };
    return updated;
  });
  if (!updated) throw new Error(`PlantType ${id} not found`);
  await writeTypes(config, seasonId, newTypes, sha);
  return updated;
}

export async function deletePlantType(config: GitHubConfig, id: string, seasonId: string = DEFAULT_SEASON_ID): Promise<void> {
  const { types, sha } = await readTypes(config, seasonId);
  await writeTypes(config, seasonId, types.filter((t) => t.id !== id), sha);
}
