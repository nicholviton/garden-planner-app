import { useState } from 'react';
import { Sprout } from 'lucide-react';
import type { PlantType } from '@/types/plantType';
import type { GardenBed } from '@/types/layout';
import { Button } from '@/components/ui/Button';

interface QuickPlantProps {
  plantTypes: PlantType[];
  beds: GardenBed[];
  isMutating: boolean;
  hasConfig: boolean;
  onPlant: (plantType: PlantType, bedId: string) => void;
}

export function QuickPlant({ plantTypes, beds, isMutating, hasConfig, onPlant }: QuickPlantProps) {
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');

  if (plantTypes.length === 0 || beds.length === 0) return null;

  const selectedType = plantTypes.find((t) => t.id === selectedTypeId) ?? null;
  const canPlant = !!selectedType && !!selectedBedId && !isMutating && hasConfig;

  function handlePlant() {
    if (!selectedType || !selectedBedId) return;
    onPlant(selectedType, selectedBedId);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
      <Sprout className="w-4 h-4 text-garden-600 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-700 flex-shrink-0">Quick Plant:</span>

      <select
        value={selectedTypeId}
        onChange={(e) => setSelectedTypeId(e.target.value)}
        className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
      >
        <option value="">Select plant type…</option>
        {plantTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.plantName} ({t.year})
          </option>
        ))}
      </select>

      <span className="text-sm text-gray-400 flex-shrink-0">→</span>

      <select
        value={selectedBedId}
        onChange={(e) => setSelectedBedId(e.target.value)}
        className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
      >
        <option value="">Select bed…</option>
        {beds.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <Button
        variant="primary"
        size="sm"
        onClick={handlePlant}
        disabled={!canPlant}
        loading={isMutating}
      >
        Plant
      </Button>
    </div>
  );
}
