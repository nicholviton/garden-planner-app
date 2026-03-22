import { useState } from 'react';
import type { ReactNode } from 'react';
import type { GardenBed, Planting, Fixture, FixtureCorner } from '@/types/layout';
import { bedGridCols, bedGridRows, fixtureBounds } from '@/types/layout';

function triangleClipPath(corner: FixtureCorner): string {
  switch (corner) {
    case 'top-left':     return 'polygon(0 0, 100% 0, 0 100%)';
    case 'top-right':    return 'polygon(0 0, 100% 0, 100% 100%)';
    case 'bottom-left':  return 'polygon(0 0, 0 100%, 100% 100%)';
    case 'bottom-right': return 'polygon(100% 0, 0 100%, 100% 100%)';
  }
}

const CELL_PX = 10;
const CELL_STEP = CELL_PX + 1; // cell + 1px gap
const DEFAULT_PLANT_COLOR = '#86efac';

interface BedGridProps {
  bed: GardenBed;
  year: number;
  zoomFactor?: number;
  readOnly?: boolean;
  onEmptyCellClick: (row: number, col: number) => void;
  onPlantingClick: (planting: Planting) => void;
  onMovePlanting: (planting: Planting, newRow: number, newCol: number) => void;
  onFixtureClick?: (fixture: Fixture) => void;
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

export function BedGrid({ bed, year, zoomFactor = 1, readOnly = false, onEmptyCellClick, onPlantingClick, onMovePlanting, onFixtureClick }: BedGridProps) {
  const zf = zoomFactor;
  const cols = Math.ceil(bedGridCols(bed) / zf);
  const rows = Math.ceil(bedGridRows(bed) / zf);
  const yearPlantings = bed.plantings.filter((p) => p.year === year);
  //const occupied = getOccupiedCells(yearPlantings);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  // Display dimensions for a planting (zoomed)
  function displayPlanting(p: { row: number; col: number; width: number; height: number }) {
    return {
      row: Math.floor(p.row / zf),
      col: Math.floor(p.col / zf),
      width: Math.max(1, Math.round(p.width / zf)),
      height: Math.max(1, Math.round(p.height / zf)),
    };
  }

  // Clamp proposed top-left so the planting stays inside the bed (in display coords)
  function proposed(dropRow: number, dropCol: number) {
    if (!drag) return null;
    const { planting: p, grabRow, grabCol } = drag;
    const dp = displayPlanting(p);
    return {
      row: Math.max(0, Math.min(rows - dp.height, dropRow - grabRow)),
      col: Math.max(0, Math.min(cols - dp.width,  dropCol - grabCol)),
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
    // Convert display coords back to actual coords
    const actualRow = pos.row * zf;
    const actualCol = pos.col * zf;
    if (actualRow !== drag.planting.row || actualCol !== drag.planting.col) {
      onMovePlanting(drag.planting, actualRow, actualCol);
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
          onClick={readOnly ? undefined : () => !drag && onEmptyCellClick(r * zf, c * zf)}
          style={{ gridColumn: c + 1, gridRow: r + 1 }}
          className={[
            'rounded border border-dashed border-gray-200',
            readOnly ? '' : 'cursor-pointer hover:border-garden-400 hover:bg-garden-50 transition-colors group',
          ].join(' ')}
          title={readOnly ? undefined : `Row ${r * zf + 1}, Col ${c * zf + 1}`}
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

  // Fixture tiles (permanent, not year-filtered)
  for (const f of bed.fixtures ?? []) {
    const bounds = fixtureBounds(f.shape);
    const dCol = Math.floor(f.col / zf);
    const dRow = Math.floor(f.row / zf);
    const dW = Math.max(1, Math.round(bounds.width / zf));
    const dH = Math.max(1, Math.round(bounds.height / zf));
    const isCircle = f.shape.kind === 'circle';
    const isTriangle = f.shape.kind === 'right-triangle';
    const angle = f.shape.kind === 'rectangle' && f.shape.angle !== undefined ? f.shape.angle : 0;

    cells.push(
      <div
        key={`f-${f.id}`}
        onClick={readOnly ? undefined : () => onFixtureClick?.(f)}
        style={{
          gridColumn: `${dCol + 1} / span ${dW}`,
          gridRow: `${dRow + 1} / span ${dH}`,
          backgroundColor: f.color,
          borderRadius: isCircle ? '50%' : undefined,
          clipPath: isTriangle && f.shape.kind === 'right-triangle' ? triangleClipPath(f.shape.corner) : undefined,
          transform: angle !== 0 ? `rotate(${angle}deg)` : undefined,
          zIndex: 5,
        }}
        className={[
          'flex items-center justify-center overflow-hidden border border-white/40',
          readOnly || !onFixtureClick ? 'cursor-default' : 'cursor-pointer hover:brightness-90',
        ].join(' ')}
        title={f.name}
      >
        {/*<span className="text-[7px] font-semibold text-white/90 text-center leading-tight truncate px-0.5 select-none pointer-events-none drop-shadow-sm">
          {f.name}
        </span>*/}
      </div>,
    );
  }

  // Planting tiles
  for (const p of yearPlantings) {
    const dp = displayPlanting(p);
    const bg = p.color ?? DEFAULT_PLANT_COLOR;
    const isDragging = drag?.planting.id === p.id;
    cells.push(
      <div
        key={`p-${p.id}`}
        draggable={!readOnly}
        onDragStart={readOnly ? undefined : (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const grabCol = Math.max(0, Math.min(dp.width  - 1, Math.floor((e.clientX - rect.left) / CELL_STEP)));
          const grabRow = Math.max(0, Math.min(dp.height - 1, Math.floor((e.clientY - rect.top)  / CELL_STEP)));
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
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const cellCol = Math.max(0, Math.min(dp.width  - 1, Math.floor((e.clientX - rect.left) / CELL_STEP)));
          const cellRow = Math.max(0, Math.min(dp.height - 1, Math.floor((e.clientY - rect.top)  / CELL_STEP)));
          setHoverCell({ row: dp.row + cellRow, col: dp.col + cellCol });
        }}
        onDrop={readOnly ? undefined : (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const cellCol = Math.max(0, Math.min(dp.width  - 1, Math.floor((e.clientX - rect.left) / CELL_STEP)));
          const cellRow = Math.max(0, Math.min(dp.height - 1, Math.floor((e.clientY - rect.top)  / CELL_STEP)));
          onCellDrop(e, dp.row + cellRow, dp.col + cellCol);
        }}
        onClick={readOnly ? undefined : () => !drag && onPlantingClick(p)}
        style={{
          gridColumn: `${dp.col + 1} / span ${dp.width}`,
          gridRow:    `${dp.row + 1} / span ${dp.height}`,
          backgroundColor: bg,
          opacity: isDragging ? 0.35 : 1,
          zIndex: 6,
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
    const dpPreview = displayPlanting(drag.planting);
    cells.push(
      <div
        key="preview"
        style={{
          gridColumn: `${preview.col + 1} / span ${dpPreview.width}`,
          gridRow:    `${preview.row + 1} / span ${dpPreview.height}`,
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
