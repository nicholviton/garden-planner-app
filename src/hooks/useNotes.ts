import { useState, useEffect, useMemo } from 'react';
import type { GitHubConfig } from '@/lib/github';
import type { GardenNote, NoteFormData } from '@/types/note';
import {
  getSortedNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/lib/githubStorage';

export function useNotes(config: GitHubConfig | null) {
  const [notes, setNotes] = useState<GardenNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadNotes(cfg: GitHubConfig) {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getSortedNotes(cfg);
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
  }, [config]);

  async function addNote(formData: NoteFormData) {
    if (!config) return;
    setIsMutating(true);
    setError(null);
    try {
      await createNote(config, formData);
      await loadNotes(config);
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
      await updateNote(config, id, formData, originalPhotos);
      await loadNotes(config);
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
      await deleteNote(config, id, photos);
      await loadNotes(config);
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
      n.noteText.toLowerCase().includes(q) ||
      (n.plantName?.toLowerCase().includes(q) ?? false) ||
      (n.gardenLocation?.toLowerCase().includes(q) ?? false) ||
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
