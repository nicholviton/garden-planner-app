import { useState } from 'react';
import type { GardenBed } from '@/types/layout';
import { bedGridCols, bedGridRows } from '@/types/layout';
import type { PlantType } from '@/types/plantType';
import { Button } from '@/components/ui/Button';

interface BulkPlantFormProps {
  bed: GardenBed;
  plantTypes: PlantType[];
  onAddRow: (plantType: PlantType, row: number, startCol: number, endCol: number) => void;
  onClose: () => void;
}

export function BulkPlantForm({
  bed,
  plantTypes,
  onAddRow,
  onClose,
}: BulkPlantFormProps) {
  const cols = bedGridCols(bed);
  const rows = bedGridRows(bed);

  const [plantTypeId, setPlantTypeId] = useState('');
  const [row, setRow] = useState(0);
  const [startCol, setStartCol] = useState(0);
  const [endCol, setEndCol] = useState(cols - 1);
  const [error, setError] = useState('');

  const selectedType = plantTypes.find((type) => type.id === plantTypeId) ?? null;

  function handleAddRow(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedType) {
      setError('Select a plant type.');
      return;
    }
    if (row < 0 || row >= rows) {
      setError(`Row must be between 0 and ${rows - 1}.`);
      return;
    }
    if (startCol < 0 || startCol >= cols || endCol < 0 || endCol >= cols) {
      setError(`Columns must be between 0 and ${cols - 1}.`);
      return;
    }
    if (startCol > endCol) {
      setError('Start column must not be after end column.');
      return;
    }
    if (endCol - startCol + 1 < selectedType.width) {
      setError(`The column range must be at least ${selectedType.width} cells wide.`);
      return;
    }
    if (row + selectedType.width > rows) {
      setError(`Row must be between 0 and ${rows - selectedType.width} for this plant width.`);
      return;
    }
    onAddRow(selectedType, row, startCol, endCol);
  }

  return (
    <form onSubmit={handleAddRow} className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">
        Adds the maximum evenly spaced plants that fit without overlapping existing plants or fixtures.
      </p>
          <div>
            <label htmlFor="row-plant-type" className="block text-sm font-medium text-gray-700 mb-1">Plant type</label>
            <select
              id="row-plant-type"
              value={plantTypeId}
              onChange={(event) => { setPlantTypeId(event.target.value); setError(''); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
            >
              <option value="">Select plant type…</option>
              {plantTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.plantName} ({type.width} cells wide)</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="fill-row" className="block text-sm font-medium text-gray-700 mb-1">Row <span className="font-normal text-gray-400">0–{rows - 1}</span></label>
              <input
                id="fill-row"
                type="number"
                min={0}
                max={rows - 1}
                value={row}
                onChange={(event) => { setRow(Number(event.target.value)); setError(''); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
              />
            </div>
            <div>
              <label htmlFor="fill-start-col" className="block text-sm font-medium text-gray-700 mb-1">Start col <span className="font-normal text-gray-400">0–{cols - 1}</span></label>
              <input
                id="fill-start-col"
                type="number"
                min={0}
                max={cols - 1}
                value={startCol}
                onChange={(event) => { setStartCol(Number(event.target.value)); setError(''); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
              />
            </div>
            <div>
              <label htmlFor="fill-end-col" className="block text-sm font-medium text-gray-700 mb-1">End col <span className="font-normal text-gray-400">0–{cols - 1}</span></label>
              <input
                id="fill-end-col"
                type="number"
                min={0}
                max={cols - 1}
                value={endCol}
                onChange={(event) => { setEndCol(Number(event.target.value)); setError(''); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={plantTypes.length === 0}>Add to Row</Button>
          </div>
    </form>
  );
}

interface DeletePlantTypeFormProps {
  bed: GardenBed;
  year: number;
  onDeleteType: (plantName: string) => void;
  onClose: () => void;
}

export function DeletePlantTypeForm({ bed, year, onDeleteType, onClose }: DeletePlantTypeFormProps) {
  const plantedTypes = Array.from(new Set(
    bed.plantings
      .filter((planting) => planting.year === year)
      .map((planting) => planting.plantName),
  )).sort((a, b) => a.localeCompare(b));
  const [deletePlantName, setDeletePlantName] = useState('');
  const deleteCount = bed.plantings.filter(
    (planting) => planting.year === year && planting.plantName === deletePlantName,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">Removes every matching plant from this bed in {year}.</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="delete-plant-type" className="block text-sm font-medium text-gray-700 mb-1">Plant type</label>
            <select
              id="delete-plant-type"
              value={deletePlantName}
              onChange={(event) => setDeletePlantName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
            >
              <option value="">Select planted type…</option>
              {plantedTypes.map((plantName) => <option key={plantName} value={plantName}>{plantName}</option>)}
            </select>
          </div>
          <Button
            type="button"
            variant="danger"
            disabled={!deletePlantName}
            onClick={() => onDeleteType(deletePlantName)}
          >
            Delete {deleteCount || ''}
          </Button>
        </div>
      <div className="flex justify-end border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}