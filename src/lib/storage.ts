import { v4 as uuidv4 } from 'uuid';
import type { GardenNote, NoteFormData } from '@/types/note';

const STORAGE_KEY = 'garden_planner_notes';

function readRaw(): GardenNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GardenNote[];
  } catch {
    return [];
  }
}

function writeRaw(notes: GardenNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete some notes or photos.');
    }
    throw err;
  }
}

export function getAllNotes(): GardenNote[] {
  return readRaw();
}

export function getSortedNotes(): GardenNote[] {
  const notes = readRaw();
  return notes.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function createNote(formData: NoteFormData): GardenNote {
  const notes = readRaw();
  const now = new Date().toISOString();
  const note: GardenNote = {
    ...formData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  writeRaw([...notes, note]);
  return note;
}

export function updateNote(id: string, formData: NoteFormData): GardenNote {
  const notes = readRaw();
  const now = new Date().toISOString();
  let updated: GardenNote | undefined;
  const newNotes = notes.map((n) => {
    if (n.id === id) {
      updated = { ...formData, id, createdAt: n.createdAt, updatedAt: now };
      return updated;
    }
    return n;
  });
  if (!updated) throw new Error(`Note ${id} not found`);
  writeRaw(newNotes);
  return updated;
}

export function deleteNote(id: string): void {
  const notes = readRaw();
  writeRaw(notes.filter((n) => n.id !== id));
}

export function getStorageUsageKb(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return (raw.length * 2) / 1024;
  } catch {
    return 0;
  }
}
