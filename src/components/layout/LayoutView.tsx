import { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Pencil, Lock, Plus, ListChecks, X, LayoutGrid, Table } from 'lucide-react';
import type { GardenBed, Planting } from '@/types/layout';
import type { PlantType } from '@/types/plantType';
import { Button } from '@/components/ui/Button';
import { BedList } from './BedList';
import { BedTableView } from './BedTableView';
import { QuickPlant } from './QuickPlant';

interface LayoutViewProps {
  beds: GardenBed[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
  plantTypes: PlantType[];
  // Edit-mode control
  isEditing: boolean;
  isSaving: boolean;
  changeCount: number;
  onStartEdit: () => void;
  onDone: () => void;
  onCancel: () => void;
  onShowChanges: () => void;
  // Bed / planting callbacks
  onAddBed: () => void;
  onEditBed: (bed: GardenBed) => void;
  onDeleteBed: (bed: GardenBed) => void;
  onEmptyCellClick: (bed: GardenBed, row: number, col: number) => void;
  onPlantingClick: (bed: GardenBed, planting: Planting) => void;
  onMovePlanting: (bed: GardenBed, planting: Planting, newRow: number, newCol: number) => void;
  onQuickPlant: (plantType: PlantType, bedId: string) => void;
  onDeletePlanting: (bed: GardenBed, planting: Planting) => void;
  onAddPlantingToBed: (bed: GardenBed) => void;
}

export function LayoutView({
  beds,
  selectedYear,
  onYearChange,
  isLoading,
  isMutating,
  hasConfig,
  plantTypes,
  isEditing,
  isSaving,
  changeCount,
  onStartEdit,
  onDone,
  onCancel,
  onShowChanges,
  onAddBed,
  onEditBed,
  onDeleteBed,
  onEmptyCellClick,
  onPlantingClick,
  onMovePlanting,
  onQuickPlant,
  onDeletePlanting,
  onAddPlantingToBed,
}: LayoutViewProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  useEffect(() => {
    if (!isEditing) setViewMode('visual');
  }, [isEditing]);

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Year nav */}
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

        {/* Edit controls */}
        {isEditing ? (
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'visual'
                    ? 'bg-garden-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Visual
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-gray-200 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-garden-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table
              </button>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={onAddBed}
              disabled={isMutating}
            >
              <Plus className="w-4 h-4" />
              Add Bed
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onShowChanges}
              disabled={changeCount === 0}
            >
              <ListChecks className="w-4 h-4" />
              Changes
              {changeCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-garden-600 text-white text-xs font-bold">
                  {changeCount}
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onDone}
              loading={isSaving}
            >
              <Lock className="w-4 h-4" />
              Done
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="md"
            onClick={onStartEdit}
            disabled={!hasConfig}
          >
            <Pencil className="w-4 h-4" />
            Edit Layout
          </Button>
        )}
      </div>

      {/* Edit-mode banner */}
      {isEditing && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-garden-50 border border-garden-200 text-sm text-garden-700">
          <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Editing — changes are local until you click <strong>Done</strong>.</span>
        </div>
      )}

      {isEditing && (
        <QuickPlant
          plantTypes={plantTypes}
          beds={beds}
          isMutating={isMutating}
          hasConfig={hasConfig}
          onPlant={onQuickPlant}
        />
      )}

      {viewMode === 'table' && isEditing ? (
        <BedTableView
          beds={beds}
          selectedYear={selectedYear}
          onEditPlanting={onPlantingClick}
          onDeletePlanting={onDeletePlanting}
          onAddPlanting={onAddPlantingToBed}
        />
      ) : (
        <BedList
          beds={beds}
          year={selectedYear}
          isEditing={isEditing}
          onEditBed={onEditBed}
          onDeleteBed={onDeleteBed}
          onEmptyCellClick={onEmptyCellClick}
          onPlantingClick={onPlantingClick}
          onMovePlanting={onMovePlanting}
        />
      )}
    </div>
  );
}
