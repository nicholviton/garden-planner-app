import { Sprout } from 'lucide-react';
import type { GardenNote } from '@/types/note';
import { NoteCard } from './NoteCard';

interface NoteListProps {
  notes: GardenNote[];
  onView: (note: GardenNote) => void;
  onEdit: (note: GardenNote) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
}

export function NoteList({ notes, onView, onEdit, onDelete, searchQuery }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Sprout className="w-12 h-12 mb-3 text-garden-300" />
        {searchQuery ? (
          <>
            <p className="font-medium">No notes match your search</p>
            <p className="text-sm mt-1">Try a different keyword</p>
          </>
        ) : (
          <>
            <p className="font-medium">Your garden journal is empty</p>
            <p className="text-sm mt-1">Add your first note to get started</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
