import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { PlantType, PlantTypeFormData } from '@/types/plantType';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlantTypeForm } from '@/components/forms/PlantTypeForm';

interface PlantTypeListProps {
  plantTypes: PlantType[];
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
  onAdd: (data: PlantTypeFormData) => void;
  onEdit: (id: string, data: PlantTypeFormData) => void;
  onRemove: (id: string) => void;
}

export function PlantTypeList({
  plantTypes,
  isLoading,
  isMutating,
  hasConfig,
  onAdd,
  onEdit,
  onRemove,
}: PlantTypeListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingType, setEditingType] = useState<PlantType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlantType | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-garden-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading plant types…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Plant Types</h2>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddOpen(true)}
            disabled={isMutating || !hasConfig}
            loading={isMutating}
          >
            <Plus className="w-4 h-4" />
            Add Plant Type
          </Button>
        </div>

        {plantTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <span className="text-4xl">🌱</span>
            <p className="text-sm">No plant types yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {plantTypes.map((pt) => (
              <div
                key={pt.id}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 border border-white/60 shadow-sm mt-0.5"
                  style={{ backgroundColor: pt.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{pt.plantName}</p>
                  {(pt.genus || pt.species) && (
                    <p className="text-xs text-gray-500 italic truncate">
                      {[pt.genus, pt.species].filter(Boolean).join(' ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{pt.width} cell{pt.width !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{pt.year}</span>
                      {pt.daysToHarvest != null && (
                        <>
                          <span>·</span>
                          <span>{pt.daysToHarvest}d harvest</span>
                        </>
                      )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingType(pt)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-garden-600 hover:bg-garden-50 transition-colors"
                    title="Edit plant type"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(pt)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete plant type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddOpen && (
        <Modal title="New Plant Type" onClose={() => setIsAddOpen(false)}>
          <PlantTypeForm
            onSubmit={(data) => { onAdd(data); setIsAddOpen(false); }}
            onClose={() => setIsAddOpen(false)}
            loading={isMutating}
          />
        </Modal>
      )}

      {editingType && (
        <Modal title="Edit Plant Type" onClose={() => setEditingType(null)}>
          <PlantTypeForm
            plantType={editingType}
            onSubmit={(data) => { onEdit(editingType.id, data); setEditingType(null); }}
            onClose={() => setEditingType(null)}
            loading={isMutating}
          />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Plant Type?"
          message={`"${confirmDelete.plantName}" will be permanently deleted.`}
          onConfirm={() => { onRemove(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
