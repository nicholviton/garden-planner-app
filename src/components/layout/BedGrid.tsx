import type { GardenBed, Planting } from '@/types/layout';
import { bedGridCols, bedGridRows } from '@/types/layout';

interface BedGridProps {
  bed: GardenBed;
  year: number;
  onEmptyCellClick: (row: number, col: number) => void;
  onPlantingClick: (planting: Planting) => void;
}

function getOccupiedCells(plantings: Planting[]): Set<string> {
  const occupied = new Set<string>();
  for (const p of plantings) {
    for (let r = p.row; r < p.row + p.height; r++) {
      for (let c = p.col; c < p.col + p.width; c++) {
        occupied.add(`${r},${c}`);
      }
    }
  }
  return occupied;
}

export function BedGrid({ bed, year, onEmptyCellClick, onPlantingClick }: BedGridProps) {
  const cols = bedGridCols(bed);
  const rows = bedGridRows(bed);
  const yearPlantings = bed.plantings.filter((p) => p.year === year);
  const occupied = getOccupiedCells(yearPlantings);

  // Build grid items: empty cells + planting tiles
  const cells: React.ReactNode[] = [];

  // Empty cells (skip occupied ones)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (occupied.has(`${r},${c}`)) continue;
      cells.push(
        <button
          key={`empty-${r}-${c}`}
          type="button"
          onClick={() => onEmptyCellClick(r, c)}
          style={{ gridColumn: c + 1, gridRow: r + 1 }}
          className="min-h-[4rem] rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 hover:border-garden-400 hover:text-garden-400 hover:bg-garden-50 transition-colors group"
          title={`Row ${r + 1}, Col ${c + 1}`}
        >
          <span className="text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">+</span>
        </button>,
      );
    }
  }

  // Planting tiles
  for (const p of yearPlantings) {
    cells.push(
      <button
        key={`planting-${p.id}`}
        type="button"
        onClick={() => onPlantingClick(p)}
        style={{
          gridColumn: `${p.col + 1} / span ${p.width}`,
          gridRow: `${p.row + 1} / span ${p.height}`,
        }}
        className="min-h-[4rem] rounded-full bg-garden-200 border-2 border-garden-400 flex flex-col items-center justify-center p-2 hover:bg-garden-300 transition-colors cursor-pointer"
        title={p.plantName}
      >
        <span className="text-xs font-medium text-garden-800 text-center leading-snug break-words w-full">
          {p.plantName}
        </span>
        {(p.sowDate || p.harvestDate) && (
          <div className="mt-1 flex flex-col items-center gap-0.5">
            {p.sowDate && (
              <span className="text-[10px] bg-earth-100 text-earth-700 rounded px-1 py-0.5 leading-none">
                Sow: {p.sowDate}
              </span>
            )}
            {p.harvestDate && (
              <span className="text-[10px] bg-earth-100 text-earth-700 rounded px-1 py-0.5 leading-none">
                Harvest: {p.harvestDate}
              </span>
            )}
          </div>
        )}
      </button>,
    );
  }

  return (
    <div
      className="grid gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(4rem, auto))`,
      }}
    >
      {cells}
    </div>
  );
}
