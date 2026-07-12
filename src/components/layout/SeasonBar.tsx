import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { Season } from '@/types/season';
import { Button } from '@/components/ui/Button';

interface SeasonBarProps {
  seasons: Season[];
  selectedSeasonId: string;
  onSelectSeason: (seasonId: string) => void;
  onAddSeason: (name: string) => Promise<boolean>;
  onMoveSeason: (seasonId: string, direction: 'up' | 'down') => Promise<boolean>;
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
}

export function SeasonBar({
  seasons,
  selectedSeasonId,
  onSelectSeason,
  onAddSeason,
  onMoveSeason,
  isLoading,
  isMutating,
  hasConfig,
}: SeasonBarProps) {
  const [newSeasonName, setNewSeasonName] = useState('');

  const selectedIndex = useMemo(
    () => seasons.findIndex((season) => season.id === selectedSeasonId),
    [seasons, selectedSeasonId],
  );

  async function handleAddSeason() {
    const ok = await onAddSeason(newSeasonName.trim());
    if (ok) setNewSeasonName('');
  }

  const disabled = !hasConfig || isLoading || isMutating;

  return (
    <div className="border-b border-gray-200 bg-garden-50/60">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-56">
          <label className="text-xs font-semibold text-garden-800 uppercase tracking-wide">Season</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => onSelectSeason(e.target.value)}
            disabled={disabled}
            className="h-9 rounded-lg border border-garden-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-garden-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMoveSeason(selectedSeasonId, 'up')}
            disabled={disabled || selectedIndex <= 0}
          >
            <ChevronUp className="w-4 h-4" />
            Move Up
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMoveSeason(selectedSeasonId, 'down')}
            disabled={disabled || selectedIndex < 0 || selectedIndex >= seasons.length - 1}
          >
            <ChevronDown className="w-4 h-4" />
            Move Down
          </Button>
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <div className="flex flex-col gap-1 min-w-56">
            <label className="text-xs font-semibold text-garden-800 uppercase tracking-wide">New Season</label>
            <input
              type="text"
              value={newSeasonName}
              onChange={(e) => setNewSeasonName(e.target.value)}
              placeholder="e.g. Spring 2027"
              disabled={disabled}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddSeason}
            disabled={disabled || newSeasonName.trim().length === 0}
          >
            <Plus className="w-4 h-4" />
            Create Season
          </Button>
        </div>
      </div>
    </div>
  );
}
