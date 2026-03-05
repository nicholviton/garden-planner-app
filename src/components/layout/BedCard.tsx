import { Pencil, Trash2 } from 'lucide-react';
import type { GardenBed, Planting } from '@/types/layout';
import { bedGridCols, bedGridRows } from '@/types/layout';
import { BedGrid } from './BedGrid';

interface BedCardProps {
  bed: GardenBed;
  year: number;
  onEdit: (bed: GardenBed) => void;
  onDelete: (bed: GardenBed) => void;
  onEmptyCellClick: (bed: GardenBed, row: number, col: number) => void;
  onPlantingClick: (bed: GardenBed, planting: Planting) => void;
}

export function BedCard({ bed, year, onEdit, onDelete, onEmptyCellClick, onPlantingClick }: BedCardProps) {
  const yearCount = bed.plantings.filter((p) => p.year === year).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-800">{bed.name}</h3>
          <p className="text-xs text-gray-500">
            {bed.widthIn}" × {bed.heightIn}" · {bedGridCols(bed)} × {bedGridRows(bed)} grid · {yearCount} planting{yearCount !== 1 ? 's' : ''} in {year}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(bed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Edit bed"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(bed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete bed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <BedGrid
          bed={bed}
          year={year}
          onEmptyCellClick={(row, col) => onEmptyCellClick(bed, row, col)}
          onPlantingClick={(planting) => onPlantingClick(bed, planting)}
        />
      </div>
    </div>
  );
}
