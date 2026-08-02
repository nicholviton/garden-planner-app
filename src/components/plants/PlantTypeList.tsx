import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Pencil, Trash2, Loader2, Lock, X, Table, CalendarDays, Copy } from 'lucide-react';
import type { PlantType, PlantTypeFormData } from '@/types/plantType';
import type { Season } from '@/types/season';
import { getSeedInfo, getTransplantInfo, computeHarvestDate } from '@/types/plantType';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlantTypeForm } from '@/components/forms/PlantTypeForm';
import { PlantTypeTimeline } from './PlantTypeTimeline';

interface PlantTypeListProps {
  plantTypes: PlantType[];
  isLoading: boolean;
  isMutating: boolean;
  hasConfig: boolean;
  seasons: Season[];
  selectedSeasonId: string;
  commitPlantTypes: (types: PlantType[]) => Promise<boolean>;
  loadPlantTypesForSeason: (seasonId: string) => Promise<PlantType[]>;
}

export function PlantTypeList({
  plantTypes,
  isLoading,
  isMutating,
  hasConfig,
  seasons,
  selectedSeasonId,
  commitPlantTypes,
  loadPlantTypesForSeason,
}: PlantTypeListProps) {
  const [draftTypes, setDraftTypes] = useState<PlantType[] | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingType, setEditingType] = useState<PlantType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlantType | null>(null);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [sourceSeasonId, setSourceSeasonId] = useState('');
  const [sourceTypes, setSourceTypes] = useState<PlantType[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set());
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const isEditing = draftTypes !== null;
  const displayTypes = (isEditing ? draftTypes : plantTypes)
    .slice()
    .sort((a, b) => a.plantName.localeCompare(b.plantName));

  const sourceSeasons = seasons.filter((season) => season.id !== selectedSeasonId);

  function typeKey(type: PlantType) {
    return [type.plantName, type.genus, type.species, type.year]
      .map((value) => String(value).trim().toLocaleLowerCase())
      .join('|');
  }

  const existingTypeKeys = new Set((draftTypes ?? plantTypes).map(typeKey));
  const availableSourceTypes = sourceTypes.filter((type) => !existingTypeKeys.has(typeKey(type)));

  async function handleSourceSeasonChange(seasonId: string) {
    setSourceSeasonId(seasonId);
    setSourceTypes([]);
    setSelectedTypeIds(new Set());
    setCopyError(null);
    if (!seasonId) return;

    setIsLoadingSource(true);
    try {
      setSourceTypes(await loadPlantTypesForSeason(seasonId));
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingSource(false);
    }
  }

  function handleToggleType(id: string) {
    setSelectedTypeIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCopyTypes() {
    const now = new Date().toISOString();
    const copies = sourceTypes
      .filter((type) => selectedTypeIds.has(type.id) && !existingTypeKeys.has(typeKey(type)))
      .map((type) => ({ ...type, id: uuidv4(), createdAt: now }));
    if (copies.length === 0) return;

    setDraftTypes((previous) => previous ? [...previous, ...copies] : previous);
    setIsCopyOpen(false);
  }

  function handleStartEdit() {
    setDraftTypes(JSON.parse(JSON.stringify(plantTypes)));
  }

  async function handleDoneEdit() {
    if (!draftTypes) return;
    const success = await commitPlantTypes(draftTypes);
    if (success) setDraftTypes(null);
  }

  function handleCancelEdit() {
    setDraftTypes(null);
    setIsAddOpen(false);
    setIsCopyOpen(false);
    setEditingType(null);
    setConfirmDelete(null);
  }

  function handleAdd(data: PlantTypeFormData) {
    const pt: PlantType = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
    setDraftTypes((prev) => (prev ? [...prev, pt] : prev));
    setIsAddOpen(false);
  }

  function handleEdit(data: PlantTypeFormData) {
    if (!editingType) return;
    setDraftTypes((prev) =>
      prev ? prev.map((t) => (t.id === editingType.id ? { ...t, ...data } : t)) : prev,
    );
    setEditingType(null);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setDraftTypes((prev) => (prev ? prev.filter((t) => t.id !== confirmDelete.id) : prev));
    setConfirmDelete(null);
  }

  if (isLoading && !isEditing) {
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
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Plant Types</h2>
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-garden-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-gray-200 transition-colors ${
                  viewMode === 'timeline' ? 'bg-garden-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Timeline
              </button>
            </div>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="primary" size="md" onClick={() => setIsAddOpen(true)} disabled={isMutating}>
                <Plus className="w-4 h-4" />
                Add Plant Type
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsCopyOpen(true)}
                disabled={isMutating || sourceSeasons.length === 0}
              >
                <Copy className="w-4 h-4" />
                Copy from Season
              </Button>
              <Button variant="secondary" size="md" onClick={handleCancelEdit} disabled={isMutating}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleDoneEdit} loading={isMutating}>
                <Lock className="w-4 h-4" />
                Done
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="md" onClick={handleStartEdit} disabled={!hasConfig}>
              <Pencil className="w-4 h-4" />
              Edit Plant Types
            </Button>
          )}
        </div>

        {/* Edit-mode banner */}
        {isEditing && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-garden-50 border border-garden-200 text-sm text-garden-700">
            <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Editing — changes are local until you click <strong>Done</strong>.</span>
          </div>
        )}

        {viewMode === 'timeline' ? (
          <PlantTypeTimeline plantTypes={displayTypes} />
        ) : displayTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <span className="text-4xl">🌱</span>
            <p className="text-sm">
              {isEditing
                ? 'No plant types yet. Add one above.'
                : 'No plant types yet. Click Edit Plant Types to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2">Plant</th>
                  <th className="px-3 py-2">Genus / Species</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Days</th>
                  <th className="px-3 py-2">Seed</th>
                  <th className="px-3 py-2">Transplant</th>
                  <th className="px-3 py-2">Harvest</th>
                  {/* <th className="px-3 py-2">SI Planned</th>
                  <th className="px-3 py-2">SI Actual</th>
                  <th className="px-3 py-2">SO Planned</th>
                  <th className="px-3 py-2">SO Actual</th>
                  <th className="px-3 py-2">Trans. Planned</th>
                  <th className="px-3 py-2">Trans. Actual</th>
                  <th className="px-3 py-2">Harvest</th> */}
                  {isEditing && <th className="px-3 py-2">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayTypes.map((pt) => (
                  <tr key={pt.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: pt.color }}
                        />
                        {pt.plantName}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 italic">
                      {[pt.genus, pt.species].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {pt.width} cell{pt.width !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{pt.year}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {pt.daysToHarvest != null ? `${pt.daysToHarvest}d` : '—'}
                    </td>
                    {(() => {
                      const seedInfo = getSeedInfo(pt);
                      const transplantInfo = getTransplantInfo(pt);
                      const harvestDate = computeHarvestDate(pt);
                      return (
                        <>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {seedInfo ? (
                              <span className={seedInfo.source === 'actual' ? 'font-bold text-gray-800' : 'italic text-gray-400'}>
                                {seedInfo.date}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {transplantInfo ? (
                              <span className={transplantInfo.source === 'actual' ? 'font-bold text-gray-800' : 'italic text-gray-400'}>
                                {transplantInfo.date}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {harvestDate ? (
                              <span className="italic text-gray-500">{harvestDate}</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        </>
                      );
                    })()}
                    {/* <td className="px-3 py-2 text-gray-500">{pt.seedInsidePlanned ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{pt.seedInsideActual ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{pt.seedOutsidePlanned ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{pt.seedOutsideActual ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{pt.transplantPlanned ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{pt.transplantActual ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600 font-medium">
                      {harvestDate ?? '—'}
                    </td> */}
                    {isEditing && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingType(pt)}
                            className="p-1 text-gray-400 hover:text-garden-600 rounded transition-colors"
                            title="Edit plant type"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(pt)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete plant type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddOpen && (

        <Modal title="New Plant Type" onClose={() => setIsAddOpen(false)}>
          <PlantTypeForm onSubmit={handleAdd} onClose={() => setIsAddOpen(false)} />
        </Modal>
      )}

      {editingType && (
        <Modal title="Edit Plant Type" onClose={() => setEditingType(null)}>
          <PlantTypeForm
            plantType={editingType}
            onSubmit={handleEdit}
            onClose={() => setEditingType(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Plant Type?"
          message={`"${confirmDelete.plantName}" will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {isCopyOpen && (
        <Modal title="Copy Plant Types" onClose={() => setIsCopyOpen(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="copy-source-season" className="text-sm font-medium text-gray-700">
                Copy from
              </label>
              <select
                id="copy-source-season"
                value={sourceSeasonId}
                onChange={(event) => handleSourceSeasonChange(event.target.value)}
                disabled={isLoadingSource || isMutating}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-garden-500 disabled:bg-gray-100"
              >
                <option value="">Choose a season</option>
                {sourceSeasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>

            {copyError && <p className="text-sm text-red-700">{copyError}</p>}

            {isLoadingSource ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-garden-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading plant types…
              </div>
            ) : sourceSeasonId && sourceTypes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">This season has no plant types.</p>
            ) : sourceTypes.length > 0 ? (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">Plant types</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTypeIds(new Set(availableSourceTypes.map((type) => type.id)))}
                    className="text-xs font-medium text-garden-700 hover:text-garden-800"
                  >
                    Select all available
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {sourceTypes
                    .slice()
                    .sort((a, b) => a.plantName.localeCompare(b.plantName))
                    .map((type) => {
                      const alreadyExists = existingTypeKeys.has(typeKey(type));
                      return (
                        <label
                          key={type.id}
                          className={`flex items-center gap-3 px-3 py-2.5 ${alreadyExists ? 'bg-gray-50 text-gray-400' : 'cursor-pointer hover:bg-garden-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTypeIds.has(type.id)}
                            onChange={() => handleToggleType(type.id)}
                            disabled={alreadyExists || isMutating}
                            className="h-4 w-4 rounded border-gray-300 text-garden-600 focus:ring-garden-500"
                          />
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                          <span className="flex-1 text-sm font-medium">{type.plantName}</span>
                          <span className="text-xs">{alreadyExists ? 'Already in this season' : type.year}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Button variant="secondary" onClick={() => setIsCopyOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCopyTypes}
                loading={isMutating}
                disabled={selectedTypeIds.size === 0}
              >
                <Copy className="w-4 h-4" />
                Copy {selectedTypeIds.size || ''}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
