import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile, deleteFile, getFileSha } from '@/lib/github';
import type { GardenNote, GardenPhoto, NoteFormData } from '@/types/note';
import { DEFAULT_SEASON_ID } from '@/types/season';

const NOTES_PATH = 'notes.json';

function notesPathForSeason(seasonId: string): string {
  return `seasons/${seasonId}/notes.json`;
}

function isDefaultSeason(seasonId: string): boolean {
  return seasonId === DEFAULT_SEASON_ID;
}

async function readSeasonNotes(
  config: GitHubConfig,
  seasonId: string,
  forceLoad: boolean = false,
): Promise<{ notes: GardenNote[]; sha?: string; path: string }> {
  const seasonPath = notesPathForSeason(seasonId);
  const seasonFile = await getJsonFile<GardenNote[]>(config, seasonPath, forceLoad);
  if (seasonFile) {
    return { notes: seasonFile.data, sha: seasonFile.sha, path: seasonPath };
  }

  if (isDefaultSeason(seasonId)) {
    const legacy = await getJsonFile<GardenNote[]>(config, NOTES_PATH, forceLoad);
    if (legacy) {
      return { notes: legacy.data, sha: legacy.sha, path: NOTES_PATH };
    }
  }

  return { notes: [], path: seasonPath };
}

function sortNotes(notes: GardenNote[]): GardenNote[] {
  return [...notes].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function toBase64(dataUrl: string): string {
  // Strip the "data:image/jpeg;base64," prefix
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

function jsonToBase64(data: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
}

/** Upload a photo dataUrl to GitHub, returns updated GardenPhoto with path set, dataUrl cleared. */
async function uploadPhoto(config: GitHubConfig, photo: GardenPhoto): Promise<GardenPhoto> {
  if (!photo.dataUrl) return photo; // Already uploaded
  const path = `photos/${photo.id}.jpg`;
  const base64 = toBase64(photo.dataUrl);
  await putFile(config, path, base64, `Add photo ${photo.id}`);
  return { id: photo.id, path, fileName: photo.fileName, sizeKb: photo.sizeKb };
}

/** Delete a photo file from GitHub if it has a path. */
async function removePhoto(config: GitHubConfig, photo: GardenPhoto): Promise<void> {
  if (!photo.path) return;
  const sha = await getFileSha(config, photo.path);
  if (!sha) return; // Already gone
  await deleteFile(config, photo.path, sha, `Remove photo ${photo.id}`);
}

export async function getSortedNotes(config: GitHubConfig, forceLoad: boolean = false): Promise<GardenNote[]> {
  const { notes } = await readSeasonNotes(config, DEFAULT_SEASON_ID, forceLoad);
  return sortNotes(notes);
}

export async function getSortedNotesForSeason(
  config: GitHubConfig,
  seasonId: string,
  forceLoad: boolean = false,
): Promise<GardenNote[]> {
  const { notes } = await readSeasonNotes(config, seasonId, forceLoad);
  return sortNotes(notes);
}

export async function createNote(
  config: GitHubConfig,
  formData: NoteFormData,
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenNote> {
  // 1. Upload each new photo (has dataUrl, no path)
  const uploadedPhotos: GardenPhoto[] = await Promise.all(
    formData.photos.map((p) => uploadPhoto(config, p)),
  );

  // 2. Build new note
  const now = new Date().toISOString();
  const note: GardenNote = {
    ...formData,
    seasonId,
    photos: uploadedPhotos,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  // 3. Read-modify-write notes.json
  const existing = await readSeasonNotes(config, seasonId, true);
  const notes = existing.notes;
  const sha = existing.sha;
  await putFile(
    config,
    existing.path,
    jsonToBase64([...notes, note]),
    `Add note ${note.id}`,
    sha,
  );

  return note;
}

export async function updateNote(
  config: GitHubConfig,
  id: string,
  formData: NoteFormData,
  originalPhotos: GardenPhoto[],
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<GardenNote> {
  const existing = await readSeasonNotes(config, seasonId, true);
  if (!existing.notes.some((note) => note.id === id)) throw new Error(`Note ${id} not found`);

  // 1. Upload new photos (have dataUrl, no path)
  const uploadedPhotos: GardenPhoto[] = await Promise.all(
    formData.photos.map((p) => (p.dataUrl && !p.path ? uploadPhoto(config, p) : Promise.resolve(p))),
  );

  // 2. Delete removed photos
  const currentIds = new Set(formData.photos.map((p) => p.id));
  const removed = originalPhotos.filter((p) => !currentIds.has(p.id));
  await Promise.all(removed.map((p) => removePhoto(config, p)));

  // 3. Read-modify-write notes.json
  const now = new Date().toISOString();
  let updated: GardenNote | undefined;
  const newNotes = existing.notes.map((n) => {
    if (n.id === id) {
      updated = {
        ...formData,
        seasonId: n.seasonId ?? seasonId,
        photos: uploadedPhotos,
        id,
        createdAt: n.createdAt,
        updatedAt: now,
      };
      return updated;
    }
    return n;
  });
  if (!updated) throw new Error(`Note ${id} not found`);
  await putFile(config, existing.path, jsonToBase64(newNotes), `Update note ${id}`, existing.sha);
  return updated;
}

export async function deleteNote(
  config: GitHubConfig,
  id: string,
  photos: GardenPhoto[],
  seasonId: string = DEFAULT_SEASON_ID,
): Promise<void> {
  const existing = await readSeasonNotes(config, seasonId, true);
  if (!existing.sha) return; // Nothing to do

  // 1. Delete photo files
  await Promise.all(photos.map((p) => removePhoto(config, p)));

  // 2. Read-modify-write notes.json
  const filtered = existing.notes.filter((n) => n.id !== id);
  await putFile(config, existing.path, jsonToBase64(filtered), `Delete note ${id}`, existing.sha);
}

/**
 * Migrate a batch of notes (e.g. from localStorage) in a single notes.json write.
 * onProgress is called after each note's photos are uploaded.
 */
export async function migrateNotes(
  config: GitHubConfig,
  localNotes: GardenNote[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const migrated: GardenNote[] = [];
  for (let i = 0; i < localNotes.length; i++) {
    const note = localNotes[i];
    // Upload photos for this note (they have dataUrl, no path)
    // eslint-disable-next-line no-await-in-loop
    const uploadedPhotos = await Promise.all(note.photos.map((p) => uploadPhoto(config, p)));
    migrated.push({ ...note, photos: uploadedPhotos });
    onProgress?.(i + 1, localNotes.length);
  }

  // Single read-modify-write for notes.json
  const existing = await getJsonFile<GardenNote[]>(config, NOTES_PATH);
  const base = existing?.data ?? [];
  const sha = existing?.sha;
  await putFile(
    config,
    NOTES_PATH,
    jsonToBase64([...base, ...migrated]),
    `Migrate ${migrated.length} notes from localStorage`,
    sha,
  );
}
