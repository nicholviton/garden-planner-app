import { useState } from 'react';
import type { Planting, PlantingFormData, GardenBed } from '@/types/layout';
import { bedGridCols, bedGridRows } from '@/types/layout';
import { Button } from '@/components/ui/Button';

const PRESET_COLORS = [
  '#86efac', // soft green
  '#fde047', // soft yellow
  '#fdba74', // soft orange
  '#fca5a5', // soft red
  '#d8b4fe', // soft purple
  '#93c5fd', // soft blue
  '#f9a8d4', // soft pink
  '#cbd5e1', // soft gray
];

const DEFAULT_COLOR = PRESET_COLORS[0];

interface PlantingFormProps {
  planting?: Planting;
  row: number;
  col: number;
  bed: GardenBed;
  year: number;
  onSubmit: (data: PlantingFormData) => void;
  onDelete: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function wouldOverlap(
  existing: Planting[],
  row: number,
  col: number,
  width: number,
  height: number,
  excludeId?: string,
): boolean {
  for (const p of existing) {
    if (p.id === excludeId) continue;
    if (
      row < p.row + p.height &&
      row + height > p.row &&
      col < p.col + p.width &&
      col + width > p.col
    )
      return true;
  }
  return false;
}

export function PlantingForm({
  planting,
  row,
  col,
  bed,
  year,
  onSubmit,
  onDelete,
  onClose,
  loading = false,
}: PlantingFormProps) {
  const [plantName, setPlantName] = useState(planting?.plantName ?? '');
  const [color, setColor] = useState(planting?.color ?? DEFAULT_COLOR);
  const [width, setWidth] = useState(planting?.width ?? 1);
  const [height, setHeight] = useState(planting?.height ?? 1);
  const [sowDate, setSowDate] = useState(planting?.sowDate ?? '');
  const [harvestDate, setHarvestDate] = useState(planting?.harvestDate ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const maxWidth = bedGridCols(bed) - col;
  const maxHeight = bedGridRows(bed) - row;

  function validate(): string[] {
    const errs: string[] = [];
    if (!plantName.trim()) errs.push('Plant name is required.');
    if (width < 1 || width > maxWidth) errs.push(`Width must be between 1 and ${maxWidth}.`);
    if (height < 1 || height > maxHeight) errs.push(`Height must be between 1 and ${maxHeight}.`);
    const yearPlantings = bed.plantings.filter((p) => p.year === year);
    if (wouldOverlap(yearPlantings, row, col, width, height, planting?.id)) {
      errs.push('This area overlaps with another planting.');
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    onSubmit({ plantName: plantName.trim(), color, width, height, sowDate, harvestDate });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">
        Cell: row {row + 1}, col {col + 1} — {year}
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Plant Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={plantName}
          onChange={(e) => { setPlantName(e.target.value); setErrors([]); }}
          placeholder="e.g. Tomatoes"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={[
                'w-7 h-7 rounded-full border-2 transition-transform',
                color === c ? 'border-gray-600 scale-110' : 'border-transparent hover:scale-105',
              ].join(' ')}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-300"
            title="Custom color"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width (cols) <span className="text-gray-400 font-normal">max {maxWidth}</span>
          </label>
          <input
            type="number"
            min={1}
            max={maxWidth}
            value={width}
            onChange={(e) => { setWidth(Math.max(1, Math.min(maxWidth, parseInt(e.target.value) || 1))); setErrors([]); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (rows) <span className="text-gray-400 font-normal">max {maxHeight}</span>
          </label>
          <input
            type="number"
            min={1}
            max={maxHeight}
            value={height}
            onChange={(e) => { setHeight(Math.max(1, Math.min(maxHeight, parseInt(e.target.value) || 1))); setErrors([]); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sow Date</label>
          <input
            type="date"
            value={sowDate}
            onChange={(e) => setSowDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
          <input
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="text-xs text-red-600 space-y-0.5">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex justify-between items-center pt-2">
        <div>
          {planting && (
            <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={loading}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
