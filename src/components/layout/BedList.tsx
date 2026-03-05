import { Sprout } from 'lucide-react';
import type { GardenBed, Planting } from '@/types/layout';
import { BedCard } from './BedCard';

interface BedListProps {
  beds: GardenBed[];
  year: number;
  onEditBed: (bed: GardenBed) => void;
  onDeleteBed: (bed: GardenBed) => void;
  onEmptyCellClick: (bed: GardenBed, row: number, col: number) => void;
  onPlantingClick: (bed: GardenBed, planting: Planting) => void;
}

export function BedList({ beds, year, onEditBed, onDeleteBed, onEmptyCellClick, onPlantingClick }: BedListProps) {
  if (beds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Sprout className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-base font-medium">No beds yet</p>
        <p className="text-sm mt-1">Add your first garden bed to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {beds.map((bed) => (
        <BedCard
          key={bed.id}
          bed={bed}
          year={year}
          onEdit={onEditBed}
          onDelete={onDeleteBed}
          onEmptyCellClick={onEmptyCellClick}
          onPlantingClick={onPlantingClick}
        />
      ))}
    </div>
  );
}
