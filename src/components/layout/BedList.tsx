import { Sprout } from 'lucide-react';
import type { GardenBed, Planting, Fixture } from '@/types/layout';
import { BedCard } from './BedCard';

interface BedListProps {
  beds: GardenBed[];
  year: number;
  zoomFactor?: number;
  selectedBedId: string | null;
  onSelectedBedChange: (bedId: string) => void;
  isEditing: boolean;
  onEditBed: (bed: GardenBed) => void;
  onDeleteBed: (bed: GardenBed) => void;
  onEmptyCellClick: (bed: GardenBed, row: number, col: number) => void;
  onPlantingClick: (bed: GardenBed, planting: Planting) => void;
  onMovePlanting: (bed: GardenBed, planting: Planting, newRow: number, newCol: number) => void;
  onAddFixture: (bed: GardenBed) => void;
  onFixtureClick: (bed: GardenBed, fixture: Fixture) => void;
}

export function BedList({ beds, year, zoomFactor = 1, selectedBedId, onSelectedBedChange, isEditing, onEditBed, onDeleteBed, onEmptyCellClick, onPlantingClick, onMovePlanting, onAddFixture, onFixtureClick }: BedListProps) {

  if (beds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Sprout className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-base font-medium">No beds yet</p>
        <p className="text-sm mt-1">Add your first garden bed to get started.</p>
      </div>
    );
  }

  const selectedBed = beds.find((b) => b.id === selectedBedId) ?? beds[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Bed picker */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {beds.map((bed) => (
          <button
            key={bed.id}
            type="button"
            onClick={() => onSelectedBedChange(bed.id)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              bed.id === selectedBed.id
                ? 'bg-garden-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {bed.name}
          </button>
        ))}
      </div>

      {/* Selected bed */}
      <BedCard
        key={selectedBed.id}
        bed={selectedBed}
        year={year}
        zoomFactor={zoomFactor}
        isEditing={isEditing}
        onEdit={onEditBed}
        onDelete={onDeleteBed}
        onEmptyCellClick={onEmptyCellClick}
        onPlantingClick={onPlantingClick}
        onMovePlanting={onMovePlanting}
        onAddFixture={onAddFixture}
        onFixtureClick={onFixtureClick}
      />
    </div>
  );
}
