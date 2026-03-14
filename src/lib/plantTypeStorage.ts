import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile } from '@/lib/github';
import type { PlantType, PlantTypeFormData } from '@/types/plantType';

const PLANT_TYPES_PATH = 'plant-types.json';

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

async function readTypes(config: GitHubConfig, forceLoad: boolean = false): Promise<{ types: PlantType[]; sha?: string }> {
  const result = await getJsonFile<PlantType[]>(config, PLANT_TYPES_PATH, forceLoad);
  if (!result) return { types: [] };
  return { types: result.data, sha: result.sha };
}

async function writeTypes(config: GitHubConfig, types: PlantType[], sha?: string): Promise<void> {
  await putFile(config, PLANT_TYPES_PATH, jsonToBase64(types), 'Update plant types', sha);
}

export async function getPlantTypes(config: GitHubConfig, forceLoad: boolean = false): Promise<PlantType[]> {
  const { types } = await readTypes(config, forceLoad);
  return types;
}

export async function overwritePlantTypes(config: GitHubConfig, types: PlantType[]): Promise<void> {
  const { sha } = await readTypes(config);
  await writeTypes(config, types, sha);
}

export async function savePlantType(config: GitHubConfig, data: PlantTypeFormData): Promise<PlantType> {
  const { types, sha } = await readTypes(config);
  const pt: PlantType = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
  await writeTypes(config, [...types, pt], sha);
  return pt;
}

export async function updatePlantType(
  config: GitHubConfig,
  id: string,
  data: PlantTypeFormData,
): Promise<PlantType> {
  const { types, sha } = await readTypes(config);
  let updated: PlantType | undefined;
  const newTypes = types.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, ...data };
    return updated;
  });
  if (!updated) throw new Error(`PlantType ${id} not found`);
  await writeTypes(config, newTypes, sha);
  return updated;
}

export async function deletePlantType(config: GitHubConfig, id: string): Promise<void> {
  const { types, sha } = await readTypes(config);
  await writeTypes(config, types.filter((t) => t.id !== id), sha);
}
