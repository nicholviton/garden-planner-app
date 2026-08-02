import { useState, useEffect, useMemo } from 'react';
import type { GitHubConfig } from '@/lib/github';
import type { GardenNote, NoteFormData } from '@/types/note';
import { noteTextToPlainText } from '@/lib/noteText';
import {
  getSortedNotesForSeason,
  createNote,
  updateNote,
  deleteNote,
} from '@/lib/githubStorage';

export function useNotes(config: GitHubConfig | null, seasonId: string) {
  const [notes, setNotes] = useState<GardenNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadNotes(cfg: GitHubConfig, forceRefresh: boolean = false) {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getSortedNotesForSeason(cfg, seasonId, forceRefresh);
      setNotes(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!config) {
      setNotes([]);
      return;
    }
    loadNotes(config);
  }, [config, seasonId]);

  async function addNote(formData: NoteFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await createNote(config, formData, seasonId);
      await loadNotes(config, true); // Force refresh after save
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function editNote(id: string, formData: NoteFormData, originalPhotos: GardenNote['photos']) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await updateNote(config, id, formData, originalPhotos, seasonId);
      await loadNotes(config, true); // Force refresh after save
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  async function removeNote(id: string, photos: GardenNote['photos']) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await deleteNote(config, id, photos, seasonId);
      await loadNotes(config, true); // Force refresh after save
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMutating(false);
    }
  }

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      (n.title?.toLowerCase().includes(q) ?? false) ||
      noteTextToPlainText(n.noteText).toLowerCase().includes(q) ||
      n.date.includes(q),
    );
  }, [notes, searchQuery]);

  return {
    notes: filteredNotes,
    totalCount: notes.length,
    isLoading,
    isMutating,
    error,
    searchQuery,
    setSearchQuery,
    addNote,
    editNote,
    removeNote,
  };
}
