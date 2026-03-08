import { v4 as uuidv4 } from 'uuid';
import type { GardenBed, Planting, BedFormData, PlantingFormData } from '@/types/layout';
import type { PlantType } from '@/types/plantType';
import { findPlacement } from '@/lib/layoutStorage';

function parseDays(s: string): number | undefined {
  const n = parseInt(s);
  return s.trim() !== '' && !isNaN(n) ? n : undefined;
}

// ── Pure draft mutations ──────────────────────────────────────────────────────

export function draftAddBed(beds: GardenBed[], data: BedFormData): GardenBed[] {
  const now = new Date().toISOString();
  const bed: GardenBed = {
    id: uuidv4(),
    name: data.name,
    widthIn: data.widthIn,
    heightIn: data.heightIn,
    plantings: [],
    createdAt: now,
    updatedAt: now,
  };
  return [...beds, bed];
}

export function draftEditBed(beds: GardenBed[], id: string, data: BedFormData): GardenBed[] {
  return beds.map((b) =>
    b.id !== id
      ? b
      : { ...b, name: data.name, widthIn: data.widthIn, heightIn: data.heightIn, updatedAt: new Date().toISOString() },
  );
}

export function draftDeleteBed(beds: GardenBed[], id: string): GardenBed[] {
  return beds.filter((b) => b.id !== id);
}

export function draftAddPlanting(
  beds: GardenBed[],
  bedId: string,
  row: number,
  col: number,
  year: number,
  data: PlantingFormData,
): GardenBed[] {
  const planting: Planting = {
    id: uuidv4(),
    bedId,
    year,
    row,
    col,
    width: data.width,
    height: data.width,
    plantName: data.plantName,
    color: data.color,
    ...(data.sowDate ? { sowDate: data.sowDate } : {}),
    ...(data.harvestDate ? { harvestDate: data.harvestDate } : {}),
    ...(parseDays(data.daysToHarvest) != null ? { daysToHarvest: parseDays(data.daysToHarvest) } : {}),
  };
  return beds.map((b) =>
    b.id !== bedId ? b : { ...b, plantings: [...b.plantings, planting], updatedAt: new Date().toISOString() },
  );
}

export function draftEditPlanting(
  beds: GardenBed[],
  bedId: string,
  plantingId: string,
  data: PlantingFormData,
): GardenBed[] {
  return beds.map((b) => {
    if (b.id !== bedId) return b;
    return {
      ...b,
      updatedAt: new Date().toISOString(),
      plantings: b.plantings.map((p) => {
        if (p.id !== plantingId) return p;
        return {
          ...p,
          plantName: data.plantName,
          color: data.color,
          width: data.width,
          height: data.width,
          sowDate: data.sowDate || undefined,
          harvestDate: data.harvestDate || undefined,
          daysToHarvest: parseDays(data.daysToHarvest),
        };
      }),
    };
  });
}

export function draftDeletePlanting(beds: GardenBed[], bedId: string, plantingId: string): GardenBed[] {
  return beds.map((b) =>
    b.id !== bedId
      ? b
      : { ...b, plantings: b.plantings.filter((p) => p.id !== plantingId), updatedAt: new Date().toISOString() },
  );
}

export function draftMovePlanting(
  beds: GardenBed[],
  bedId: string,
  plantingId: string,
  row: number,
  col: number,
): GardenBed[] {
  return beds.map((b) => {
    if (b.id !== bedId) return b;
    return {
      ...b,
      plantings: b.plantings.map((p) => (p.id !== plantingId ? p : { ...p, row, col })),
      updatedAt: new Date().toISOString(),
    };
  });
}

export function draftAddPlantingFromType(
  beds: GardenBed[],
  bedId: string,
  plantType: PlantType,
): GardenBed[] {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return beds;
  const { row, col } = findPlacement(bed, plantType.year, plantType.width);
  const planting: Planting = {
    id: uuidv4(),
    bedId,
    year: plantType.year,
    row,
    col,
    width: plantType.width,
    height: plantType.width,
    plantName: plantType.plantName,
    color: plantType.color,
    ...(plantType.daysToHarvest != null ? { daysToHarvest: plantType.daysToHarvest } : {}),
  };
  return beds.map((b) =>
    b.id !== bedId ? b : { ...b, plantings: [...b.plantings, planting], updatedAt: new Date().toISOString() },
  );
}

// ── Diff ─────────────────────────────────────────────────────────────────────

export interface BedChangeSummary {
  bed: GardenBed;
  propChanges: string[];
  addedPlantings: Planting[];
  deletedPlantings: Planting[];
  movedPlantings: Planting[];
  editedPlantings: Planting[];
}

export interface LayoutDiff {
  addedBeds: GardenBed[];
  deletedBeds: GardenBed[];
  modifiedBeds: BedChangeSummary[];
}

export function computeDiff(original: GardenBed[], draft: GardenBed[]): LayoutDiff {
  const origMap = new Map(original.map((b) => [b.id, b]));
  const draftMap = new Map(draft.map((b) => [b.id, b]));

  const addedBeds = draft.filter((b) => !origMap.has(b.id));
  const deletedBeds = original.filter((b) => !draftMap.has(b.id));

  const modifiedBeds: BedChangeSummary[] = [];
  for (const origBed of original) {
    const draftBed = draftMap.get(origBed.id);
    if (!draftBed) continue;

    const propChanges: string[] = [];
    if (origBed.name !== draftBed.name) propChanges.push(`Renamed to "${draftBed.name}"`);
    if (origBed.widthIn !== draftBed.widthIn || origBed.heightIn !== draftBed.heightIn)
      propChanges.push(`Size changed to ${draftBed.widthIn}" × ${draftBed.heightIn}"`);

    const origPMap = new Map(origBed.plantings.map((p) => [p.id, p]));
    const draftPMap = new Map(draftBed.plantings.map((p) => [p.id, p]));

    const addedPlantings = draftBed.plantings.filter((p) => !origPMap.has(p.id));
    const deletedPlantings = origBed.plantings.filter((p) => !draftPMap.has(p.id));
    const movedPlantings: Planting[] = [];
    const editedPlantings: Planting[] = [];

    for (const op of origBed.plantings) {
      const dp = draftPMap.get(op.id);
      if (!dp) continue;
      const dataChanged =
        op.plantName !== dp.plantName ||
        op.color !== dp.color ||
        op.width !== dp.width ||
        op.sowDate !== dp.sowDate ||
        op.harvestDate !== dp.harvestDate ||
        op.daysToHarvest !== dp.daysToHarvest;
      const posChanged = op.row !== dp.row || op.col !== dp.col;
      if (dataChanged) editedPlantings.push(dp);
      else if (posChanged) movedPlantings.push(dp);
    }

    if (
      propChanges.length ||
      addedPlantings.length ||
      deletedPlantings.length ||
      movedPlantings.length ||
      editedPlantings.length
    ) {
      modifiedBeds.push({ bed: draftBed, propChanges, addedPlantings, deletedPlantings, movedPlantings, editedPlantings });
    }
  }

  return { addedBeds, deletedBeds, modifiedBeds };
}

export function countChanges(diff: LayoutDiff): number {
  let n = diff.addedBeds.length + diff.deletedBeds.length;
  for (const m of diff.modifiedBeds) {
    n += m.propChanges.length + m.addedPlantings.length + m.deletedPlantings.length + m.movedPlantings.length + m.editedPlantings.length;
  }
  return n;
}
