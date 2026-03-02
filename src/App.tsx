import { useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { loadConfig } from '@/lib/githubConfig';
import type { GitHubConfig } from '@/lib/github';
import { useNotes } from '@/hooks/useNotes';
import { GitHubConfigContext } from '@/contexts/GitHubConfigContext';
import type { GardenNote } from '@/types/note';

import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/search/SearchBar';
import { Button } from '@/components/ui/Button';
import { NoteList } from '@/components/notes/NoteList';
import { NoteDetail } from '@/components/notes/NoteDetail';
import { Modal } from '@/components/ui/Modal';
import { NoteForm } from '@/components/forms/NoteForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SettingsModal } from '@/components/settings/SettingsModal';

export default function App() {
  const [config, setConfig] = useState<GitHubConfig | null>(loadConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!config);

  const { notes, totalCount, isLoading, isMutating, error, searchQuery, setSearchQuery, addNote, editNote, removeNote } = useNotes(config);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GardenNote | null>(null);
  const [viewingNote, setViewingNote] = useState<GardenNote | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GardenNote | null>(null);

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

  function handleSaveConfig(cfg: GitHubConfig) {
    setConfig(cfg);
    setIsSettingsOpen(false);
  }

  return (
    <GitHubConfigContext.Provider value={config}>
      <div className="min-h-screen bg-garden-50 flex flex-col">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} totalNotes={totalCount} />

        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2">
            <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-garden-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Loading notes…</span>
            </div>
          </div>
        ) : (
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
            {/* Toolbar */}
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
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            currentConfig={config}
            onClose={config ? () => setIsSettingsOpen(false) : undefined}
            onSave={handleSaveConfig}
          />
        )}

        {/* Add Note Modal */}
        {isAddOpen && (
          <Modal title="New Garden Note" onClose={() => setIsAddOpen(false)}>
            <NoteForm onSubmit={handleAddSubmit} onClose={() => setIsAddOpen(false)} />
          </Modal>
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <Modal title="Edit Note" onClose={() => setEditingNote(null)}>
            <NoteForm
              note={editingNote}
              onSubmit={handleEditSubmit}
              onClose={() => setEditingNote(null)}
            />
          </Modal>
        )}

        {/* View Note Modal */}
        {viewingNote && (
          <NoteDetail
            note={viewingNote}
            onClose={() => setViewingNote(null)}
            onEdit={(n) => { setViewingNote(null); setEditingNote(n); }}
          />
        )}

        {/* Delete Confirm */}
        {confirmDelete && (
          <ConfirmDialog
            message="This note and all its photos will be permanently deleted from GitHub."
            onConfirm={handleDeleteConfirm}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    </GitHubConfigContext.Provider>
  );
}
