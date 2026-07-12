import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile } from '@/lib/github';
import { getBeds, overwriteBeds } from '@/lib/layoutStorage';
import type { Season } from '@/types/season';
import { buildDefaultSeason } from '@/types/season';
import type { GardenBed } from '@/types/layout';

const SEASONS_PATH = 'seasons.json';

function seasonNotesPath(seasonId: string): string {
  return `seasons/${seasonId}/notes.json`;
}

function seasonPlantTypesPath(seasonId: string): string {
  return `seasons/${seasonId}/plant-types.json`;
}

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

function sortByOrder(seasons: Season[]): Season[] {
  return [...seasons].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

async function readSeasons(config: GitHubConfig, forceLoad: boolean = false): Promise<{ seasons: Season[]; sha?: string }> {
  const result = await getJsonFile<Season[]>(config, SEASONS_PATH, forceLoad);
  if (!result) return { seasons: [buildDefaultSeason()] };
  const parsed = Array.isArray(result.data) ? result.data : [];
  if (parsed.length === 0) {
    return { seasons: [buildDefaultSeason()], sha: result.sha };
  }
  return { seasons: sortByOrder(parsed), sha: result.sha };
}

async function writeSeasons(config: GitHubConfig, seasons: Season[], sha?: string): Promise<void> {
  const sorted = sortByOrder(seasons).map((season, idx) => ({ ...season, order: idx }));
  await putFile(config, SEASONS_PATH, jsonToBase64(sorted), 'Update seasons', sha);
}

function cloneBedsWithoutPlantings(beds: GardenBed[]): GardenBed[] {
  const now = new Date().toISOString();
  return beds.map((bed) => ({
    ...bed,
    plantings: [],
    fixtures: bed.fixtures ? bed.fixtures.map((fixture) => ({ ...fixture })) : undefined,
    updatedAt: now,
  }));
}

async function initializeSeasonFiles(
  config: GitHubConfig,
  seasonId: string,
  sourceSeasonId: string | null,
): Promise<void> {
  const sourceBeds = sourceSeasonId ? await getBeds(config, sourceSeasonId, true) : [];
  const clonedBeds = cloneBedsWithoutPlantings(sourceBeds);

  await overwriteBeds(config, clonedBeds, seasonId);
  await putFile(config, seasonNotesPath(seasonId), jsonToBase64([]), `Initialize notes for season ${seasonId}`);
  await putFile(config, seasonPlantTypesPath(seasonId), jsonToBase64([]), `Initialize plant types for season ${seasonId}`);
}

export async function getSeasons(config: GitHubConfig, forceLoad: boolean = false): Promise<Season[]> {
  const { seasons } = await readSeasons(config, forceLoad);
  return seasons;
}

export async function createSeason(config: GitHubConfig, name: string): Promise<Season> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Season name is required.');

  const { seasons, sha } = await readSeasons(config);
  const duplicate = seasons.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) throw new Error(`Season "${trimmed}" already exists.`);

  const season: Season = {
    id: uuidv4(),
    name: trimmed,
    order: seasons.length,
    createdAt: new Date().toISOString(),
  };

  const sourceSeasonId = seasons.length > 0 ? seasons[seasons.length - 1].id : null;
  await initializeSeasonFiles(config, season.id, sourceSeasonId);
  await writeSeasons(config, [...seasons, season], sha);
  return season;
}

export async function reorderSeasons(config: GitHubConfig, orderedSeasonIds: string[]): Promise<Season[]> {
  const { seasons, sha } = await readSeasons(config);
  const byId = new Map(seasons.map((season) => [season.id, season]));

  const reordered = orderedSeasonIds
    .map((id) => byId.get(id))
    .filter((season): season is Season => Boolean(season));

  const missing = seasons.filter((season) => !orderedSeasonIds.includes(season.id));
  const finalOrder = [...reordered, ...missing].map((season, idx) => ({ ...season, order: idx }));

  await writeSeasons(config, finalOrder, sha);
  return finalOrder;
}
