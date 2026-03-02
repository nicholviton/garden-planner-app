export interface GardenPhoto {
  id: string;
  path?: string;     // "photos/{uuid}.jpg" — set after GitHub upload
  dataUrl?: string;  // base64 data URL — present during editing or after lazy-fetch
  fileName: string;
  sizeKb: number;
}

export interface GardenNote {
  id: string;            // uuid v4
  date: string;          // "YYYY-MM-DD"
  noteText: string;      // required
  plantName?: string;    // optional
  gardenLocation?: string; // optional
  photos: GardenPhoto[]; // always an array
  createdAt: string;     // ISO datetime
  updatedAt: string;
}

export type NoteFormData = Omit<GardenNote, 'id' | 'createdAt' | 'updatedAt'>;
