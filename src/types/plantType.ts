export interface PlantType {
  id: string;
  plantName: string;
  genus: string;
  species: string;
  width: number;
  color: string;
  year: number;
  daysToHarvest?: number;
  seedInsidePlanned?: string;   // YYYY-MM-DD
  seedInsideActual?: string;
  seedOutsidePlanned?: string;
  seedOutsideActual?: string;
  transplantPlanned?: string;
  transplantActual?: string;
  createdAt: string;
}

export type PlantTypeFormData = Omit<PlantType, 'id' | 'createdAt'>;

export type DateSource = 'actual' | 'planned';
export interface DateInfo { date: string; source: DateSource }

/** Effective seed date following the priority: SI Actual → SO Actual → SI Planned → SO Planned. */
export function getSeedInfo(pt: PlantType): DateInfo | null {
  if (pt.seedInsideActual)   return { date: pt.seedInsideActual,   source: 'actual' };
  if (pt.seedOutsideActual)  return { date: pt.seedOutsideActual,  source: 'actual' };
  if (pt.seedInsidePlanned)  return { date: pt.seedInsidePlanned,  source: 'planned' };
  if (pt.seedOutsidePlanned) return { date: pt.seedOutsidePlanned, source: 'planned' };
  return null;
}

/** Effective transplant date: Actual first, then Planned. */
export function getTransplantInfo(pt: PlantType): DateInfo | null {
  if (pt.transplantActual)  return { date: pt.transplantActual,  source: 'actual' };
  if (pt.transplantPlanned) return { date: pt.transplantPlanned, source: 'planned' };
  return null;
}

/** Calculated harvest date: transplantActual (or transplantPlanned) + daysToHarvest days. */
export function computeHarvestDate(pt: PlantType): string | null {
  if (pt.daysToHarvest == null) return null;
  const base = pt.transplantActual ?? pt.transplantPlanned ?? null;
  if (!base) return null;
  const d = new Date(base);
  d.setDate(d.getDate() + pt.daysToHarvest);
  return d.toISOString().slice(0, 10);
}
