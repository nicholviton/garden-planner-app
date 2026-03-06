import type { GardenBed, Planting } from '@/types/layout';
import { bedGridCols, bedGridRows } from '@/types/layout';

const CELL_PX = 10;
const DEFAULT_PLANT_COLOR = '#86efac';

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
          className="rounded border border-dashed border-gray-300 hover:border-garden-400 hover:bg-garden-50 transition-colors group"
          title={`Row ${r + 1}, Col ${c + 1}`}
        >
          <span className="text-[9px] leading-none text-gray-300 group-hover:text-garden-400 flex items-center justify-center w-full h-full">
            +
          </span>
        </button>,
      );
    }
  }

  // Planting tiles
  for (const p of yearPlantings) {
    const bg = p.color ?? DEFAULT_PLANT_COLOR;
    const tileW = p.width * CELL_PX + (p.width - 1); // include gap pixels
    const tileH = p.height * CELL_PX + (p.height - 1);
    cells.push(
      <button
        key={`planting-${p.id}`}
        type="button"
        onClick={() => onPlantingClick(p)}
        style={{
          gridColumn: `${p.col + 1} / span ${p.width}`,
          gridRow: `${p.row + 1} / span ${p.height}`,
          backgroundColor: bg,
          width: tileW,
          height: tileH,
        }}
        className="rounded-lg border border-white/60 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:brightness-90 transition-all p-0.5"
        title={p.plantName}
      >
        <span className="text-[9px] font-medium text-gray-800 text-center leading-tight w-full truncate px-0.5">
          {p.plantName}
        </span>
      </button>,
    );
  }

  return (
    <div className="overflow-auto">
      <div
        className="p-1 bg-gray-50 rounded-lg border border-gray-200 inline-grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
