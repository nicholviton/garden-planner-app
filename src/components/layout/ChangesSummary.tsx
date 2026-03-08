import type { GardenBed } from '@/types/layout';
import { Modal } from '@/components/ui/Modal';
import { computeDiff } from '@/lib/layoutDraft';

interface ChangesSummaryProps {
  original: GardenBed[];
  draft: GardenBed[];
  onClose: () => void;
}

export function ChangesSummary({ original, draft, onClose }: ChangesSummaryProps) {
  const diff = computeDiff(original, draft);
  const hasChanges =
    diff.addedBeds.length > 0 || diff.deletedBeds.length > 0 || diff.modifiedBeds.length > 0;

  return (
    <Modal title="Pending Changes" onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
        {!hasChanges && (
          <p className="text-gray-500 text-center py-6">No changes yet.</p>
        )}

        {diff.addedBeds.length > 0 && (
          <section>
            <h3 className="font-semibold text-garden-700 mb-1.5">
              Beds Added ({diff.addedBeds.length})
            </h3>
            <ul className="space-y-1 pl-3 border-l-2 border-garden-200">
              {diff.addedBeds.map((b) => (
                <li key={b.id} className="text-gray-700">
                  <span className="text-garden-600 font-medium mr-1">+</span>{b.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {diff.deletedBeds.length > 0 && (
          <section>
            <h3 className="font-semibold text-red-600 mb-1.5">
              Beds Deleted ({diff.deletedBeds.length})
            </h3>
            <ul className="space-y-1 pl-3 border-l-2 border-red-200">
              {diff.deletedBeds.map((b) => (
                <li key={b.id} className="text-gray-700">
                  <span className="text-red-500 font-medium mr-1">−</span>{b.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {diff.modifiedBeds.map((m) => (
          <section key={m.bed.id} className="border-t border-gray-100 pt-3">
            <h3 className="font-semibold text-gray-800 mb-1.5">"{m.bed.name}"</h3>
            <ul className="space-y-1 pl-3 border-l-2 border-gray-200">
              {m.propChanges.map((c) => (
                <li key={c} className="text-gray-600">
                  <span className="text-gray-500 mr-1">✎</span>{c}
                </li>
              ))}
              {m.addedPlantings.map((p) => (
                <li key={`a-${p.id}`} className="text-garden-700">
                  <span className="font-medium mr-1">+</span>Added: {p.plantName}
                </li>
              ))}
              {m.deletedPlantings.map((p) => (
                <li key={`d-${p.id}`} className="text-red-600">
                  <span className="font-medium mr-1">−</span>Deleted: {p.plantName}
                </li>
              ))}
              {m.movedPlantings.map((p) => (
                <li key={`m-${p.id}`} className="text-blue-600">
                  <span className="font-medium mr-1">↔</span>Moved: {p.plantName}
                </li>
              ))}
              {m.editedPlantings.map((p) => (
                <li key={`e-${p.id}`} className="text-amber-600">
                  <span className="font-medium mr-1">✎</span>Edited: {p.plantName}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
