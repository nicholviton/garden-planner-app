import { Pencil, Trash2, Plus } from 'lucide-react';
import type { GardenBed, Planting } from '@/types/layout';
import { Button } from '@/components/ui/Button';

interface BedTableViewProps {
  beds: GardenBed[];
  selectedYear: number;
  onEditPlanting: (bed: GardenBed, planting: Planting) => void;
  onDeletePlanting: (bed: GardenBed, planting: Planting) => void;
  onAddPlanting: (bed: GardenBed) => void;
}

export function BedTableView({
  beds,
  selectedYear,
  onEditPlanting,
  onDeletePlanting,
  onAddPlanting,
}: BedTableViewProps) {
  if (beds.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No beds yet. Add a bed to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {beds.map((bed) => {
        const plantings = bed.plantings
          .filter((p) => p.year === selectedYear)
          .sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
        return (
          <section key={bed.id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">
                {bed.name}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {bed.widthIn}" × {bed.heightIn}"
                </span>
              </h3>
              <Button variant="secondary" size="sm" onClick={() => onAddPlanting(bed)}>
                <Plus className="w-3.5 h-3.5" />
                Add Planting
              </Button>
            </div>

            {plantings.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                No plantings for {selectedYear}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2">Plant</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Col</th>
                      <th className="px-3 py-2">Sow Date</th>
                      <th className="px-3 py-2">Harvest Date</th>
                      <th className="px-3 py-2">Days</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plantings.map((planting) => (
                      <tr key={planting.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">
                          <span className="inline-flex items-center gap-1.5">
                            {planting.color && (
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: planting.color }}
                              />
                            )}
                            {planting.plantName}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{planting.width}"</td>
                        <td className="px-3 py-2 text-gray-600">{planting.row}</td>
                        <td className="px-3 py-2 text-gray-600">{planting.col}</td>
                        <td className="px-3 py-2 text-gray-500">{planting.sowDate ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{planting.harvestDate ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {planting.daysToHarvest != null ? `${planting.daysToHarvest}d` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditPlanting(bed, planting)}
                              className="p-1 text-gray-400 hover:text-garden-600 rounded transition-colors"
                              title="Edit planting"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePlanting(bed, planting)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                              title="Delete planting"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
