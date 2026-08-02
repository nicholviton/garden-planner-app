import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import type { GardenNote, NoteFormData, GardenPhoto } from '@/types/note';
import { Button } from '@/components/ui/Button';
import { PhotoUploader } from './PhotoUploader';
import { noteTextToHtml, noteTextToPlainText, sanitizeNoteHtml } from '@/lib/noteText';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface NoteFormProps {
  note?: GardenNote;
  onSubmit: (data: NoteFormData) => void;
  onClose: () => void;
}

export function NoteForm({ note, onSubmit, onClose }: NoteFormProps) {
  const [date, setDate] = useState(note?.date ?? todayStr());
  const [title, setTitle] = useState(note?.title ?? '');
  const [noteText, setNoteText] = useState(noteTextToHtml(note?.noteText ?? ''));
  const [photos, setPhotos] = useState<GardenPhoto[]>(note?.photos ?? []);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'What happened in the garden today?' }),
    ],
    content: noteText,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => setNoteText(currentEditor.getHTML()),
  });

  const isValid = date.trim() !== '' && title.trim() !== '' && noteTextToPlainText(noteText) !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    const formData: NoteFormData = {
      date: date.trim(),
      title: title.trim(),
      noteText: sanitizeNoteHtml(noteText),
      photos,
    };
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder="Give this note a title"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note <span className="text-red-500">*</span>
        </label>
        <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-garden-500 focus-within:border-transparent">
          <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 bg-gray-50 border-b border-gray-200">
            {[
              { label: 'Bold', icon: Bold, active: editor?.isActive('bold'), action: () => editor?.chain().focus().toggleBold().run() },
              { label: 'Italic', icon: Italic, active: editor?.isActive('italic'), action: () => editor?.chain().focus().toggleItalic().run() },
              { label: 'Bullet list', icon: List, active: editor?.isActive('bulletList'), action: () => editor?.chain().focus().toggleBulletList().run() },
              { label: 'Numbered list', icon: ListOrdered, active: editor?.isActive('orderedList'), action: () => editor?.chain().focus().toggleOrderedList().run() },
              { label: 'Quote', icon: Quote, active: editor?.isActive('blockquote'), action: () => editor?.chain().focus().toggleBlockquote().run() },
            ].map(({ label, icon: Icon, active, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                title={label}
                aria-label={label}
                aria-pressed={active}
                className={`p-1.5 rounded transition-colors ${active ? 'bg-garden-100 text-garden-700' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <span className="w-px h-5 bg-gray-300 mx-1" />
            <button type="button" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo" aria-label="Undo" className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30">
              <Undo2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo" aria-label="Redo" className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <EditorContent editor={editor} className="note-editor" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!isValid}>
          {note ? 'Save Changes' : 'Add Note'}
        </Button>
      </div>
    </form>
  );
}
