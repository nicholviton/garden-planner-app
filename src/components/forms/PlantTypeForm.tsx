import { useState } from 'react';
import type { PlantType, PlantTypeFormData } from '@/types/plantType';
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

interface PlantTypeFormProps {
  plantType?: PlantType;
  onSubmit: (data: PlantTypeFormData) => void;
  onClose: () => void;
  loading?: boolean;
}

export function PlantTypeForm({ plantType, onSubmit, onClose, loading = false }: PlantTypeFormProps) {
  const [plantName, setPlantName] = useState(plantType?.plantName ?? '');
  const [genus, setGenus] = useState(plantType?.genus ?? '');
  const [species, setSpecies] = useState(plantType?.species ?? '');
  const [width, setWidth] = useState(plantType?.width ?? 1);
  const [color, setColor] = useState(plantType?.color ?? DEFAULT_COLOR);
  const [year, setYear] = useState(plantType?.year ?? new Date().getFullYear());
  const [errors, setErrors] = useState<string[]>([]);

  function validate(): string[] {
    const errs: string[] = [];
    if (!plantName.trim()) errs.push('Plant name is required.');
    if (width < 1) errs.push('Width must be at least 1.');
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    onSubmit({ plantName: plantName.trim(), genus: genus.trim(), species: species.trim(), width, color, year });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Genus</label>
          <input
            type="text"
            value={genus}
            onChange={(e) => setGenus(e.target.value)}
            placeholder="e.g. Solanum"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="e.g. lycopersicum"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (cells)</label>
          <input
            type="number"
            min={1}
            value={width}
            onChange={(e) => { setWidth(Math.max(1, parseInt(e.target.value) || 1)); setErrors([]); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
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

      {errors.length > 0 && (
        <ul className="text-xs text-red-600 space-y-0.5">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Save
        </Button>
      </div>
    </form>
  );
}
