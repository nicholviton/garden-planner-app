import { useState } from 'react';
import type { GardenBed, BedFormData } from '@/types/layout';
import { CELL_SIZE_IN } from '@/types/layout';
import { Button } from '@/components/ui/Button';

interface BedFormProps {
  bed?: GardenBed;
  onSubmit: (data: BedFormData) => void;
  onClose: () => void;
  loading?: boolean;
}

export function BedForm({ bed, onSubmit, onClose, loading = false }: BedFormProps) {
  const [name, setName] = useState(bed?.name ?? '');
  const [widthIn, setWidthIn] = useState(bed?.widthIn ?? 48);
  const [heightIn, setHeightIn] = useState(bed?.heightIn ?? 36);
  const [nameError, setNameError] = useState('');

  const gridCols = Math.max(1, Math.round(widthIn / CELL_SIZE_IN));
  const gridRows = Math.max(1, Math.round(heightIn / CELL_SIZE_IN));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    onSubmit({ name: name.trim(), widthIn, heightIn });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bed Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(''); }}
          placeholder="e.g. Front Veg Patch"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
        />
        {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (inches)</label>
          <input
            type="number"
            min={CELL_SIZE_IN}
            max={360}
            step={1}
            value={widthIn}
            onChange={(e) => setWidthIn(Math.max(CELL_SIZE_IN, Math.min(360, parseInt(e.target.value) || CELL_SIZE_IN)))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
          <input
            type="number"
            min={CELL_SIZE_IN}
            max={360}
            step={1}
            value={heightIn}
            onChange={(e) => setHeightIn(Math.max(CELL_SIZE_IN, Math.min(360, parseInt(e.target.value) || CELL_SIZE_IN)))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {widthIn}" × {heightIn}" → {gridCols} × {gridRows} grid ({CELL_SIZE_IN}" per cell)
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {bed ? 'Save Changes' : 'Create Bed'}
        </Button>
      </div>
    </form>
  );
}
