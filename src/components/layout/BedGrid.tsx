import { useState } from 'react';
import type { ReactNode } from 'react';
import type { GardenBed, Planting } from '@/types/layout';
import { bedGridCols, bedGridRows } from '@/types/layout';

const CELL_PX = 10;
const CELL_STEP = CELL_PX + 1; // cell + 1px gap
const DEFAULT_PLANT_COLOR = '#86efac';

interface BedGridProps {
  bed: GardenBed;
  year: number;
  readOnly?: boolean;
  onEmptyCellClick: (row: number, col: number) => void;
  onPlantingClick: (planting: Planting) => void;
  onMovePlanting: (planting: Planting, newRow: number, newCol: number) => void;
}

interface DragState {
  planting: Planting;
  grabRow: number; // which row within the planting tile was grabbed
  grabCol: number; // which col within the planting tile was grabbed
}

/*
function getOccupiedCells(plantings: Planting[]): Set<string> {
  const s = new Set<string>();
  for (const p of plantings) {
    for (let r = p.row; r < p.row + p.height; r++)
      for (let c = p.col; c < p.col + p.width; c++)
        s.add(`${r},${c}`);
  }
  return s;
}
*/

export function BedGrid({ bed, year, readOnly = false, onEmptyCellClick, onPlantingClick, onMovePlanting }: BedGridProps) {
  const cols = bedGridCols(bed);
  const rows = bedGridRows(bed);
  const yearPlantings = bed.plantings.filter((p) => p.year === year);
  //const occupied = getOccupiedCells(yearPlantings);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  // Clamp proposed top-left so the planting stays inside the bed
  function proposed(dropRow: number, dropCol: number) {
    if (!drag) return null;
    const { planting: p, grabRow, grabCol } = drag;
    return {
      row: Math.max(0, Math.min(rows - p.height, dropRow - grabRow)),
      col: Math.max(0, Math.min(cols - p.width,  dropCol - grabCol)),
    };
  }

  function onCellDragOver(e: React.DragEvent, row: number, col: number) {
    if (!drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverCell({ row, col });
  }

  function onCellDrop(e: React.DragEvent, row: number, col: number) {
    e.preventDefault();
    if (!drag) return;
    const pos = proposed(row, col);
    if (!pos) return;
    if (pos.row !== drag.planting.row || pos.col !== drag.planting.col) {
      onMovePlanting(drag.planting, pos.row, pos.col);
    }
    setDrag(null);
    setHoverCell(null);
  }

  // Compute preview info — overlaps are allowed so always valid
  const preview = (drag && hoverCell) ? (() => {
    const pos = proposed(hoverCell.row, hoverCell.col);
    if (!pos) return null;
    return { ...pos, valid: true };
  })() : null;

  const cells: ReactNode[] = [];

  // Empty cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      //if (occupied.has(`${r},${c}`)) continue;
      cells.push(
        <div
          key={`e-${r}-${c}`}
          onDragOver={readOnly ? undefined : (e) => onCellDragOver(e, r, c)}
          onDrop={readOnly ? undefined : (e) => onCellDrop(e, r, c)}
          onClick={readOnly ? undefined : () => !drag && onEmptyCellClick(r, c)}
          style={{ gridColumn: c + 1, gridRow: r + 1 }}
          className={[
            'rounded border border-dashed border-gray-200',
            readOnly ? '' : 'cursor-pointer hover:border-garden-400 hover:bg-garden-50 transition-colors group',
          ].join(' ')}
          title={readOnly ? undefined : `Row ${r + 1}, Col ${c + 1}`}
        >
          {!readOnly && (
            <span className="text-[7px] leading-none text-gray-300 group-hover:text-garden-400 flex items-center justify-center w-full h-full select-none">
              +
            </span>
          )}
        </div>,
      );
    }
  }

  // Planting tiles
  for (const p of yearPlantings) {
    const bg = p.color ?? DEFAULT_PLANT_COLOR;
    const isDragging = drag?.planting.id === p.id;
    cells.push(
      <div
        key={`p-${p.id}`}
        draggable={!readOnly}
        onDragStart={readOnly ? undefined : (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const grabCol = Math.max(0, Math.min(p.width  - 1, Math.floor((e.clientX - rect.left) / CELL_STEP)));
          const grabRow = Math.max(0, Math.min(p.height - 1, Math.floor((e.clientY - rect.top)  / CELL_STEP)));
          // Position the native ghost so cursor sits over the grabbed cell
          e.dataTransfer.setDragImage(
            e.currentTarget,
            grabCol * CELL_STEP + Math.floor(CELL_PX / 2),
            grabRow * CELL_STEP + Math.floor(CELL_PX / 2),
          );
          e.dataTransfer.effectAllowed = 'move';
          // Delay opacity change so ghost is captured at full opacity first
          setTimeout(() => setDrag({ planting: p, grabRow, grabCol }), 0);
        }}
        onDragEnd={readOnly ? undefined : () => { setDrag(null); setHoverCell(null); }}
        onDragOver={readOnly ? undefined : (e) => {
          // Allow dragging over other plantings (to reach cells underneath)
          //if (!drag || drag.planting.id === p.id) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const cellCol = Math.max(0, Math.min(p.width  - 1, Math.floor((e.clientX - rect.left) / CELL_STEP)));
          const cellRow = Math.max(0, Math.min(p.height - 1, Math.floor((e.clientY - rect.top)  / CELL_STEP)));
          setHoverCell({ row: p.row + cellRow, col: p.col + cellCol });
        }}
        onDrop={readOnly ? undefined : (e) => {
          //if (!drag || drag.planting.id === p.id) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const cellCol = Math.max(0, Math.min(p.width  - 1, Math.floor((e.clientX - rect.left) / CELL_STEP)));
          const cellRow = Math.max(0, Math.min(p.height - 1, Math.floor((e.clientY - rect.top)  / CELL_STEP)));
          onCellDrop(e, p.row + cellRow, p.col + cellCol);
        }}
        onClick={readOnly ? undefined : () => !drag && onPlantingClick(p)}
        style={{
          gridColumn: `${p.col + 1} / span ${p.width}`,
          gridRow:    `${p.row + 1} / span ${p.height}`,
          backgroundColor: bg,
          opacity: isDragging ? 0.35 : 1,
        }}
        className={[
          'rounded-full border border-white/60 flex items-center justify-center overflow-hidden transition-opacity p-0.5',
          readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:brightness-90',
        ].join(' ')}
        title={p.plantName}
      >
        <span className="text-[8px] font-semibold text-gray-800 text-center leading-tight w-full truncate px-0.5 select-none pointer-events-none">
          {p.plantName} <br /> Row: {p.row} Col: {p.col}
        </span>
      </div>,
    );
  }

  // Drop-preview overlay tile (rendered last = on top)
  if (!readOnly && preview && drag) {
    cells.push(
      <div
        key="preview"
        style={{
          gridColumn: `${preview.col + 1} / span ${drag.planting.width}`,
          gridRow:    `${preview.row + 1} / span ${drag.planting.height}`,
          backgroundColor: preview.valid ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)',
          border: `1px solid ${preview.valid ? '#4ade80' : '#f87171'}`,
          zIndex: 10,
          position: 'relative',
          pointerEvents: 'none',
        }}
        className="rounded-full"
      />,
    );
  }

  return (
    <div
      className="overflow-auto"
      onDragLeave={readOnly ? undefined : (e) => {
        // Only clear preview when cursor fully exits the scroll container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setHoverCell(null);
        }
      }}
    >
      <div
        className="p-1 bg-gray-50 rounded-lg border border-gray-200 inline-grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
          gridTemplateRows:    `repeat(${rows}, ${CELL_PX}px)`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
