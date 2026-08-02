import { Pencil } from 'lucide-react';
import type { GardenNote } from '@/types/note';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PhotoImage } from '@/components/common/PhotoImage';
import { sanitizeNoteHtml } from '@/lib/noteText';

interface NoteDetailProps {
  note: GardenNote;
  onClose: () => void;
  onEdit: (note: GardenNote) => void;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function NoteDetail({ note, onClose, onEdit }: NoteDetailProps) {
  return (
    <Modal title="Note Details" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {/* Date */}
        <span className="self-start text-sm font-semibold px-3 py-1 rounded-full bg-earth-100 text-earth-700">
          {formatDate(note.date)}
        </span>

        <h3 className="text-xl font-semibold text-gray-900">{note.title || 'Untitled Note'}</h3>

        {/* Note text */}
        <div
          className="note-rich-text text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.noteText) }}
        />

        {/* Photos */}
        {note.photos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Photos ({note.photos.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {note.photos.map((p) => (
                <PhotoImage
                  key={p.id}
                  photo={p}
                  className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            onClick={() => { onClose(); onEdit(note); }}
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
