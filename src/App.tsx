import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { loadConfig } from '@/lib/githubConfig';
import type { GitHubConfig } from '@/lib/github';
import { useNotes } from '@/hooks/useNotes';
import { useLayout } from '@/hooks/useLayout';
import { usePlantTypes } from '@/hooks/usePlantTypes';
import { GitHubConfigContext } from '@/contexts/GitHubConfigContext';
import type { GardenNote } from '@/types/note';
import type { GardenBed, Planting, BedFormData, PlantingFormData } from '@/types/layout';
import type { PlantType } from '@/types/plantType';
import {
  draftAddBed, draftEditBed, draftDeleteBed,
  draftAddPlanting, draftEditPlanting, draftDeletePlanting,
  draftMovePlanting, draftAddPlantingFromType,
  computeDiff, countChanges,
} from '@/lib/layoutDraft';
import { findPlacement } from '@/lib/layoutStorage';

import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import { SearchBar } from '@/components/search/SearchBar';
import { Button } from '@/components/ui/Button';
import { NoteList } from '@/components/notes/NoteList';
import { NoteDetail } from '@/components/notes/NoteDetail';
import { Modal } from '@/components/ui/Modal';
import { NoteForm } from '@/components/forms/NoteForm';
import { BedForm } from '@/components/forms/BedForm';
import { PlantingForm } from '@/components/forms/PlantingForm';
import { LayoutView } from '@/components/layout/LayoutView';
import { ChangesSummary } from '@/components/layout/ChangesSummary';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { PlantTypeList } from '@/components/plants/PlantTypeList';

export default function App() {
  const [config, setConfig] = useState<GitHubConfig | null>(loadConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!config);
  const [activeTab, setActiveTab] = useState<'notes' | 'layout' | 'plants'>('notes');

  // Notes
  const { notes, totalCount, isLoading, isMutating, error, searchQuery, setSearchQuery, addNote, editNote, removeNote } = useNotes(config);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GardenNote | null>(null);
  const [viewingNote, setViewingNote] = useState<GardenNote | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GardenNote | null>(null);

  // Layout — real persisted state
  const {
    beds,
    isLoading: isLayoutLoading,
    isMutating: isLayoutMutating,
    error: layoutError,
    selectedYear,
    setSelectedYear,
    commitBeds,
  } = useLayout(config);

  // Layout — edit session draft state
  const [draftBeds, setDraftBeds] = useState<GardenBed[] | null>(null);
  const [editSessionOriginal, setEditSessionOriginal] = useState<GardenBed[] | null>(null);
  const [isShowingChanges, setIsShowingChanges] = useState(false);

  // Modals used during edit mode
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<GardenBed | null>(null);
  const [confirmDeleteBed, setConfirmDeleteBed] = useState<GardenBed | null>(null);
  const [editingPlanting, setEditingPlanting] = useState<{
    bed: GardenBed;
    planting?: Planting;
    row: number;
    col: number;
  } | null>(null);

  // Plant Types
  const {
    plantTypes,
    isLoading: isPlantTypesLoading,
    isMutating: isPlantTypesMutating,
    error: plantTypesError,
    commitPlantTypes,
    reloadPlantTypes,
  } = usePlantTypes(config);

  useEffect(() => {
    if (activeTab === 'plants') reloadPlantTypes();
  }, [activeTab]);

  // The beds shown in LayoutView: draft when editing, real otherwise
  const isEditingLayout = draftBeds !== null;
  const displayBeds = isEditingLayout ? draftBeds : beds;

  const diff = isEditingLayout && editSessionOriginal
    ? computeDiff(editSessionOriginal, draftBeds)
    : null;
  const changeCount = diff ? countChanges(diff) : 0;

  // ── Notes handlers ──────────────────────────────────────────────────────────

  async function handleAddSubmit(formData: Parameters<typeof addNote>[0]) {
    await addNote(formData);
    setIsAddOpen(false);
  }

  async function handleEditSubmit(formData: Parameters<typeof editNote>[1]) {
    if (!editingNote) return;
    await editNote(editingNote.id, formData, editingNote.photos);
    setEditingNote(null);
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    await removeNote(confirmDelete.id, confirmDelete.photos);
    setConfirmDelete(null);
  }

  // ── Layout edit-session handlers ────────────────────────────────────────────

  function handleStartEdit() {
    const snapshot = JSON.parse(JSON.stringify(beds)) as GardenBed[];
    setDraftBeds(snapshot);
    setEditSessionOriginal(snapshot);
  }

  async function handleDoneEdit() {
    if (!draftBeds) return;
    const success = await commitBeds(draftBeds);
    if (success) {
      setDraftBeds(null);
      setEditSessionOriginal(null);
    }
    // On failure, stay in edit mode — error shown in banner
  }

  function handleCancelEdit() {
    setDraftBeds(null);
    setEditSessionOriginal(null);
    setIsAddBedOpen(false);
    setEditingBed(null);
    setConfirmDeleteBed(null);
    setEditingPlanting(null);
  }

  // ── Layout mutation handlers (all update draft synchronously) ──────────────

  function handleAddBedSubmit(data: BedFormData) {
    setDraftBeds((prev) => prev ? draftAddBed(prev, data) : prev);
    setIsAddBedOpen(false);
  }

  function handleEditBedSubmit(data: BedFormData) {
    if (!editingBed) return;
    setDraftBeds((prev) => prev ? draftEditBed(prev, editingBed.id, data) : prev);
    setEditingBed(null);
  }

  function handleDeleteBedConfirm() {
    if (!confirmDeleteBed) return;
    setDraftBeds((prev) => prev ? draftDeleteBed(prev, confirmDeleteBed.id) : prev);
    setConfirmDeleteBed(null);
  }

  function handlePlantingSubmit(data: PlantingFormData) {
    if (!editingPlanting) return;
    if (editingPlanting.planting) {
      setDraftBeds((prev) =>
        prev ? draftEditPlanting(prev, editingPlanting.bed.id, editingPlanting.planting!.id, data) : prev,
      );
    } else {
      setDraftBeds((prev) =>
        prev ? draftAddPlanting(prev, editingPlanting.bed.id, selectedYear, data) : prev,
      );
    }
    setEditingPlanting(null);
  }

  function handlePlantingDelete() {
    if (!editingPlanting?.planting) return;
    setDraftBeds((prev) =>
      prev ? draftDeletePlanting(prev, editingPlanting.bed.id, editingPlanting.planting!.id) : prev,
    );
    setEditingPlanting(null);
  }

  function handleMovePlanting(bed: GardenBed, planting: Planting, newRow: number, newCol: number) {
    setDraftBeds((prev) => prev ? draftMovePlanting(prev, bed.id, planting.id, newRow, newCol) : prev);
  }

  function handleQuickPlant(plantType: PlantType, bedId: string) {
    setDraftBeds((prev) => prev ? draftAddPlantingFromType(prev, bedId, plantType) : prev);
  }

  function handleDeletePlanting(bed: GardenBed, planting: Planting) {
    setDraftBeds((prev) => prev ? draftDeletePlanting(prev, bed.id, planting.id) : prev);
  }

  function handleAddPlantingToBed(bed: GardenBed) {
    const { row, col } = findPlacement(bed, selectedYear, 1);
    setEditingPlanting({ bed, row, col });
  }

  function handleSaveConfig(cfg: GitHubConfig) {
    setConfig(cfg);
    setIsSettingsOpen(false);
  }

  const activeError =
    activeTab === 'notes' ? error :
    activeTab === 'layout' ? layoutError :
    plantTypesError;

  return (
    <GitHubConfigContext.Provider value={config}>
      <div className="min-h-screen bg-garden-50 flex flex-col">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} totalNotes={totalCount} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2">
            <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{activeError}</span>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-garden-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Loading notes…</span>
              </div>
            </div>
          ) : (
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
              <div className="flex items-center gap-3 mb-6">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by plant, location, or text…"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddOpen(true)}
                  disabled={isMutating || !config}
                >
                  {isMutating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Note
                </Button>
              </div>
              <NoteList
                notes={notes}
                onView={setViewingNote}
                onEdit={setEditingNote}
                onDelete={(id) => {
                  const note = notes.find((n) => n.id === id);
                  if (note) setConfirmDelete(note);
                }}
                searchQuery={searchQuery}
              />
            </main>
          )
        )}

        {activeTab === 'layout' && (
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
            <LayoutView
              beds={displayBeds}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              isLoading={isLayoutLoading}
              isMutating={isLayoutMutating}
              hasConfig={!!config}
              plantTypes={plantTypes}
              isEditing={isEditingLayout}
              isSaving={isLayoutMutating}
              changeCount={changeCount}
              onStartEdit={handleStartEdit}
              onDone={handleDoneEdit}
              onCancel={handleCancelEdit}
              onShowChanges={() => setIsShowingChanges(true)}
              onAddBed={() => setIsAddBedOpen(true)}
              onEditBed={(bed) => setEditingBed(bed)}
              onDeleteBed={(bed) => setConfirmDeleteBed(bed)}
              onEmptyCellClick={(bed, row, col) => setEditingPlanting({ bed, row, col })}
              onPlantingClick={(bed, planting) => setEditingPlanting({ bed, planting, row: planting.row, col: planting.col })}
              onMovePlanting={handleMovePlanting}
              onQuickPlant={handleQuickPlant}
              onDeletePlanting={handleDeletePlanting}
              onAddPlantingToBed={handleAddPlantingToBed}
            />
          </main>
        )}

        {activeTab === 'plants' && (
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
            <PlantTypeList
              plantTypes={plantTypes}
              isLoading={isPlantTypesLoading}
              isMutating={isPlantTypesMutating}
              hasConfig={!!config}
              commitPlantTypes={commitPlantTypes}
            />
          </main>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            currentConfig={config}
            onClose={config ? () => setIsSettingsOpen(false) : undefined}
            onSave={handleSaveConfig}
          />
        )}

        {/* Notes Modals */}
        {isAddOpen && (
          <Modal title="New Garden Note" onClose={() => setIsAddOpen(false)}>
            <NoteForm onSubmit={handleAddSubmit} onClose={() => setIsAddOpen(false)} />
          </Modal>
        )}
        {editingNote && (
          <Modal title="Edit Note" onClose={() => setEditingNote(null)}>
            <NoteForm
              note={editingNote}
              onSubmit={handleEditSubmit}
              onClose={() => setEditingNote(null)}
            />
          </Modal>
        )}
        {viewingNote && (
          <NoteDetail
            note={viewingNote}
            onClose={() => setViewingNote(null)}
            onEdit={(n) => { setViewingNote(null); setEditingNote(n); }}
          />
        )}
        {confirmDelete && (
          <ConfirmDialog
            message="This note and all its photos will be permanently deleted from GitHub."
            onConfirm={handleDeleteConfirm}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        {/* Layout Modals */}
        {isAddBedOpen && (
          <Modal title="New Garden Bed" onClose={() => setIsAddBedOpen(false)}>
            <BedForm
              onSubmit={handleAddBedSubmit}
              onClose={() => setIsAddBedOpen(false)}
            />
          </Modal>
        )}
        {editingBed && (
          <Modal title="Edit Garden Bed" onClose={() => setEditingBed(null)}>
            <BedForm
              bed={editingBed}
              onSubmit={handleEditBedSubmit}
              onClose={() => setEditingBed(null)}
            />
          </Modal>
        )}
        {confirmDeleteBed && (
          <ConfirmDialog
            title="Delete Bed?"
            message={`"${confirmDeleteBed.name}" and all its plantings will be permanently deleted.`}
            onConfirm={handleDeleteBedConfirm}
            onCancel={() => setConfirmDeleteBed(null)}
          />
        )}
        {editingPlanting && (
          <Modal
            title={editingPlanting.planting ? 'Edit Planting' : 'Add Planting'}
            onClose={() => setEditingPlanting(null)}
          >
            <PlantingForm
              planting={editingPlanting.planting}
              row={editingPlanting.row}
              col={editingPlanting.col}
              bed={editingPlanting.bed}
              year={selectedYear}
              onSubmit={handlePlantingSubmit}
              onDelete={handlePlantingDelete}
              onClose={() => setEditingPlanting(null)}
            />
          </Modal>
        )}

        {/* Changes Summary */}
        {isShowingChanges && isEditingLayout && editSessionOriginal && (
          <ChangesSummary
            original={editSessionOriginal}
            draft={draftBeds!}
            onClose={() => setIsShowingChanges(false)}
          />
        )}
      </div>
    </GitHubConfigContext.Provider>
  );
}
