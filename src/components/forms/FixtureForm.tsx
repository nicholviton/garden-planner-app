import { useState } from 'react';
import type { Fixture, FixtureFormData, FixtureShape, FixtureCorner, GardenBed } from '@/types/layout';
import { bedGridCols, bedGridRows, fixtureBounds } from '@/types/layout';
import { Button } from '@/components/ui/Button';

const PRESET_COLORS = [
  '#94a3b8', // slate
  '#78716c', // warm stone
  '#a8a29e', // stone
  '#d6d3d1', // light stone
  '#6b7280', // gray
  '#e7e5e4', // off-white
  '#fde047', // yellow
  '#86efac', // green
];

const DEFAULT_COLOR = PRESET_COLORS[0];

type ShapeKind = 'circle' | 'rectangle' | 'right-triangle';

interface FixtureFormProps {
  fixture?: Fixture;
  row: number;
  col: number;
  bed: GardenBed;
  onSubmit: (data: FixtureFormData) => void;
  onDelete?: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function FixtureForm({
  fixture,
  row,
  col,
  bed,
  onSubmit,
  onDelete,
  onClose,
  loading = false,
}: FixtureFormProps) {
  const maxCols = bedGridCols(bed);
  const maxRows = bedGridRows(bed);

  const [name, setName] = useState(fixture?.name ?? '');
  const [color, setColor] = useState(fixture?.color ?? DEFAULT_COLOR);
  const [rowVal, setRowVal] = useState(row);
  const [colVal, setColVal] = useState(col);
  const [shapeKind, setShapeKind] = useState<ShapeKind>(fixture?.shape.kind ?? 'rectangle');
  const [width, setWidth] = useState(fixture ? fixtureBounds(fixture.shape).width : 1);
  const [height, setHeight] = useState(fixture ? fixtureBounds(fixture.shape).height : 1);
  const [corner, setCorner] = useState<FixtureCorner>(
    fixture?.shape.kind === 'right-triangle' ? fixture.shape.corner : 'top-left',
  );
  const [angle, setAngle] = useState(
    fixture?.shape.kind === 'rectangle' ? fixture.shape.angle ?? 0 : 0,
  );
  const [errors, setErrors] = useState<string[]>([]);

  const maxW = Math.max(1, maxCols - colVal);
  const maxH = Math.max(1, maxRows - rowVal);

  function buildShape(): FixtureShape {
    if (shapeKind === 'circle') return { kind: 'circle', width };
    if (shapeKind === 'rectangle') return { kind: 'rectangle', width, height, angle: angle !== 0 ? angle : undefined };
    return { kind: 'right-triangle', corner, width, height };
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Name is required.');
    if (rowVal < 0 || rowVal >= maxRows) errs.push(`Row must be 0–${maxRows - 1}.`);
    if (colVal < 0 || colVal >= maxCols) errs.push(`Column must be 0–${maxCols - 1}.`);
    if (width < 1 || width > maxW) errs.push(`Width must be 1–${maxW}.`);
    if (shapeKind !== 'circle' && (height < 1 || height > maxH))
      errs.push(`Height must be 1–${maxH}.`);
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    onSubmit({ name: name.trim(), color, row: rowVal, col: colVal, shape: buildShape() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors([]); }}
          placeholder="e.g. Stone Wall"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={[
                'w-7 h-7 rounded-full border-2 transition-transform',
                color === c ? 'border-gray-600 scale-110' : 'border-transparent hover:scale-105',
              ].join(' ')}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-300"
            title="Custom color"
          />
        </div>
      </div>

      {/* Shape selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['circle', 'rectangle', 'right-triangle'] as ShapeKind[]).map((kind, i) => (
            <button
              key={kind}
              type="button"
              onClick={() => { setShapeKind(kind); setErrors([]); }}
              className={[
                'flex-1 px-2 py-1.5 transition-colors',
                i > 0 ? 'border-l border-gray-200' : '',
                shapeKind === kind ? 'bg-garden-600 text-white' : 'text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {kind === 'right-triangle' ? 'Right Triangle' : kind.charAt(0).toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width <span className="text-gray-400 font-normal">max {maxW}</span>
          </label>
          <input
            type="number"
            min={1}
            max={maxW}
            value={width}
            onChange={(e) => { setWidth(Math.max(1, Math.min(maxW, parseInt(e.target.value) || 1))); setErrors([]); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        {shapeKind !== 'circle' && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height <span className="text-gray-400 font-normal">max {maxH}</span>
            </label>
            <input
              type="number"
              min={1}
              max={maxH}
              value={height}
              onChange={(e) => { setHeight(Math.max(1, Math.min(maxH, parseInt(e.target.value) || 1))); setErrors([]); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
            />
          </div>
        )}
      </div>

      {/* Angle (rectangle only) */}
      {shapeKind === 'rectangle' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Angle <span className="text-gray-400 font-normal">0–359°</span>
          </label>
          <input
            type="number"
            min={0}
            max={359}
            value={angle}
            onChange={(e) => { setAngle(Math.max(0, Math.min(359, parseInt(e.target.value) || 0))); setErrors([]); }}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
          <p className="text-xs text-gray-500 mt-1">Rotation in degrees (0 = no rotation)</p>
        </div>
      )}

      {/* Corner (right-triangle only) */}
      {shapeKind === 'right-triangle' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Right-Angle Corner</label>
          <select
            value={corner}
            onChange={(e) => setCorner(e.target.value as FixtureCorner)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          >
            <option value="top-left">Top-Left</option>
            <option value="top-right">Top-Right</option>
            <option value="bottom-left">Bottom-Left</option>
            <option value="bottom-right">Bottom-Right</option>
          </select>
        </div>
      )}

      {/* Position */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Row <span className="text-gray-400 font-normal">0–{maxRows - 1}</span>
          </label>
          <input
            type="number"
            min={0}
            max={maxRows - 1}
            value={rowVal}
            onChange={(e) => { setRowVal(Math.max(0, Math.min(maxRows - 1, parseInt(e.target.value) || 0))); setErrors([]); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Column <span className="text-gray-400 font-normal">0–{maxCols - 1}</span>
          </label>
          <input
            type="number"
            min={0}
            max={maxCols - 1}
            value={colVal}
            onChange={(e) => { setColVal(Math.max(0, Math.min(maxCols - 1, parseInt(e.target.value) || 0))); setErrors([]); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="text-xs text-red-600 space-y-0.5">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex justify-between items-center pt-2">
        <div>
          {onDelete && (
            <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={loading}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
