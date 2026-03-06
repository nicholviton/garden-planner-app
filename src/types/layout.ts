export interface Planting {
  id: string;
  bedId: string;
  year: number;
  row: number;          // top-left row, 0-indexed (in grid cells)
  col: number;          // top-left col, 0-indexed (in grid cells)
  width: number;        // columns spanned (≥ 1, in grid cells)
  height: number;       // rows spanned (≥ 1, in grid cells)
  plantName: string;
  color?: string;       // hex color, e.g. "#86efac"
  sowDate?: string;     // "YYYY-MM-DD"
  harvestDate?: string; // "YYYY-MM-DD"
}

export interface GardenBed {
  id: string;
  name: string;
  widthIn: number;   // physical width in inches
  heightIn: number;  // physical height in inches
  plantings: Planting[];   // all years combined
  createdAt: string;
  updatedAt: string;
}

export type BedFormData = Pick<GardenBed, 'name' | 'widthIn' | 'heightIn'>;

export type PlantingFormData = {
  plantName: string;
  color: string;
  width: number;
  height: number;
  sowDate: string;
  harvestDate: string;
};

/** Each grid cell represents this many inches (1 sq ft). */
export const CELL_SIZE_IN = 12;

/** Number of grid columns for a bed. */
export function bedGridCols(bed: GardenBed): number {
  //return Math.max(1, Math.round(bed.widthIn / CELL_SIZE_IN));
  return bed.widthIn;
}

/** Number of grid rows for a bed. */
export function bedGridRows(bed: GardenBed): number {
  //return Math.max(1, Math.round(bed.heightIn / CELL_SIZE_IN));
  return bed.heightIn;
}
