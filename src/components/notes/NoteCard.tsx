import { MapPin, Leaf, Image, Pencil, Trash2 } from 'lucide-react';
import type { GardenNote } from '@/types/note';
import { PhotoImage } from '@/components/common/PhotoImage';

interface NoteCardProps {
  note: GardenNote;
  onView: (note: GardenNote) => void;
  onEdit: (note: GardenNote) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function NoteCard({ note, onView, onEdit, onDelete }: NoteCardProps) {
  const firstPhoto = note.photos[0];

  return (
    <div
      className="bg-white border border-garden-200 rounded-xl shadow-sm hover:shadow-md
        transition-shadow flex flex-col"
    >
      {firstPhoto && (
        <button
          className="w-full"
          onClick={() => onView(note)}
          aria-label="View note"
        >
          <PhotoImage
            photo={firstPhoto}
            className="w-full h-36 object-cover rounded-t-xl"
          />
        </button>
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-earth-100 text-earth-700">
            {formatDate(note.date)}
          </span>
          {note.photos.length > 1 && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Image className="w-3 h-3" />
              {note.photos.length}
            </span>
          )}
        </div>

        {/* Plant name */}
        {note.plantName && (
          <div className="flex items-center gap-1 text-xs font-medium text-garden-700">
            <Leaf className="w-3 h-3" />
            {note.plantName}
          </div>
        )}

        {/* Location */}
        {note.gardenLocation && (
          <span className="inline-flex items-center gap-1 self-start text-xs px-2 py-0.5
            rounded-full bg-garden-100 text-garden-700">
            <MapPin className="w-3 h-3" />
            {note.gardenLocation}
          </span>
        )}

        {/* Note text (truncated) */}
        <button
          className="text-left text-sm text-gray-700 leading-relaxed line-clamp-3 flex-1"
          onClick={() => onView(note)}
        >
          {note.noteText}
        </button>

        {/* Actions */}
        <div className="flex justify-end gap-1 pt-1 border-t border-gray-100 mt-auto">
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
      </div>
    </div>
  );
}
