import { Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GardenBed, Planting } from '@/types/layout';
import { Button } from '@/components/ui/Button';
import { BedList } from './BedList';

interface LayoutViewProps {
  beds: GardenBed[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
  onAddBed: () => void;
  onEditBed: (bed: GardenBed) => void;
  onDeleteBed: (bed: GardenBed) => void;
  onEmptyCellClick: (bed: GardenBed, row: number, col: number) => void;
  onPlantingClick: (bed: GardenBed, planting: Planting) => void;
}

export function LayoutView({
  beds,
  selectedYear,
  onYearChange,
  isLoading,
  isMutating,
  hasConfig,
  onAddBed,
  onEditBed,
  onDeleteBed,
  onEmptyCellClick,
  onPlantingClick,
}: LayoutViewProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-garden-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading layout…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onYearChange(selectedYear - 1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Previous year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold text-gray-800 w-16 text-center">{selectedYear}</span>
          <button
            type="button"
            onClick={() => onYearChange(selectedYear + 1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Next year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onAddBed}
          disabled={isMutating || !hasConfig}
          loading={isMutating}
        >
          <Plus className="w-4 h-4" />
          Add Bed
        </Button>
      </div>

      <BedList
        beds={beds}
        year={selectedYear}
        onEditBed={onEditBed}
        onDeleteBed={onDeleteBed}
        onEmptyCellClick={onEmptyCellClick}
        onPlantingClick={onPlantingClick}
      />
    </div>
  );
}
