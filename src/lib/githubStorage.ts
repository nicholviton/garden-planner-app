import { v4 as uuidv4 } from 'uuid';
import type { GitHubConfig } from '@/lib/github';
import { getJsonFile, putFile, deleteFile, getFileSha } from '@/lib/github';
import type { GardenNote, GardenPhoto, NoteFormData } from '@/types/note';

const NOTES_PATH = 'notes.json';

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

export async function getSortedNotes(config: GitHubConfig): Promise<GardenNote[]> {
  const result = await getJsonFile<GardenNote[]>(config, NOTES_PATH);
  if (!result) return [];
  return sortNotes(result.data);
}

export async function createNote(
  config: GitHubConfig,
  formData: NoteFormData,
): Promise<GardenNote> {
  // 1. Upload each new photo (has dataUrl, no path)
  const uploadedPhotos: GardenPhoto[] = await Promise.all(
    formData.photos.map((p) => uploadPhoto(config, p)),
  );

  // 2. Build new note
  const now = new Date().toISOString();
  const note: GardenNote = {
    ...formData,
    photos: uploadedPhotos,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  // 3. Read-modify-write notes.json
  const existing = await getJsonFile<GardenNote[]>(config, NOTES_PATH);
  const notes = existing ? existing.data : [];
  const sha = existing?.sha;
  await putFile(
    config,
    NOTES_PATH,
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
): Promise<GardenNote> {
  // 1. Upload new photos (have dataUrl, no path)
  const uploadedPhotos: GardenPhoto[] = await Promise.all(
    formData.photos.map((p) => (p.dataUrl && !p.path ? uploadPhoto(config, p) : Promise.resolve(p))),
  );

  // 2. Delete removed photos
  const currentIds = new Set(formData.photos.map((p) => p.id));
  const removed = originalPhotos.filter((p) => !currentIds.has(p.id));
  await Promise.all(removed.map((p) => removePhoto(config, p)));

  // 3. Read-modify-write notes.json
  const existing = await getJsonFile<GardenNote[]>(config, NOTES_PATH);
  if (!existing) throw new Error('notes.json not found');
  const now = new Date().toISOString();
  let updated: GardenNote | undefined;
  const newNotes = existing.data.map((n) => {
    if (n.id === id) {
      updated = { ...formData, photos: uploadedPhotos, id, createdAt: n.createdAt, updatedAt: now };
      return updated;
    }
    return n;
  });
  if (!updated) throw new Error(`Note ${id} not found`);
  await putFile(config, NOTES_PATH, jsonToBase64(newNotes), `Update note ${id}`, existing.sha);
  return updated;
}

export async function deleteNote(
  config: GitHubConfig,
  id: string,
  photos: GardenPhoto[],
): Promise<void> {
  // 1. Delete photo files
  await Promise.all(photos.map((p) => removePhoto(config, p)));

  // 2. Read-modify-write notes.json
  const existing = await getJsonFile<GardenNote[]>(config, NOTES_PATH);
  if (!existing) return; // Nothing to do
  const filtered = existing.data.filter((n) => n.id !== id);
  await putFile(config, NOTES_PATH, jsonToBase64(filtered), `Delete note ${id}`, existing.sha);
}
