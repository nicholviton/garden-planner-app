import { Sprout, MapPin, Leaf, Image, Pencil, Trash2 } from 'lucide-react';
import type { GardenNote } from '@/types/note';

interface NoteListProps {
  notes: GardenNote[];
  onView: (note: GardenNote) => void;
  onEdit: (note: GardenNote) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 whitespace-nowrap">Date</th>
            <th className="px-4 py-3 whitespace-nowrap">Plant</th>
            <th className="px-4 py-3 whitespace-nowrap">Location</th>
            <th className="px-4 py-3 w-full">Note</th>
            <th className="px-4 py-3 whitespace-nowrap text-center">Photos</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {notes.map((note) => (
            <tr key={note.id} className="bg-white hover:bg-garden-50 transition-colors">
              {/* Date */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-earth-100 text-earth-700">
                  {formatDate(note.date)}
                </span>
              </td>

              {/* Plant */}
              <td className="px-4 py-3 whitespace-nowrap">
                {note.plantName ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-garden-700">
                    <Leaf className="w-3 h-3 flex-shrink-0" />
                    {note.plantName}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>

              {/* Location */}
              <td className="px-4 py-3 whitespace-nowrap">
                {note.gardenLocation ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-garden-100 text-garden-700">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {note.gardenLocation}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>

              {/* Note text */}
              <td className="px-4 py-3 max-w-sm">
                <button
                  className="text-left text-gray-700 line-clamp-2 hover:text-garden-700 transition-colors"
                  onClick={() => onView(note)}
                >
                  {note.noteText}
                </button>
              </td>

              {/* Photos */}
              <td className="px-4 py-3 text-center whitespace-nowrap">
                {note.photos.length > 0 ? (
                  <button
                    onClick={() => onView(note)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-garden-600 hover:text-garden-800 hover:underline transition-colors"
                  >
                    <Image className="w-3.5 h-3.5" />
                    {note.photos.length}
                  </button>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(note)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-garden-600 hover:bg-garden-50 transition-colors"
                    aria-label="Edit note"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(note.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
