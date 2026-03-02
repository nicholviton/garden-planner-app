import { useState } from 'react';
import type { GardenNote, NoteFormData, GardenPhoto } from '@/types/note';
import { Button } from '@/components/ui/Button';
import { PhotoUploader } from './PhotoUploader';

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
  const [noteText, setNoteText] = useState(note?.noteText ?? '');
  const [plantName, setPlantName] = useState(note?.plantName ?? '');
  const [gardenLocation, setGardenLocation] = useState(note?.gardenLocation ?? '');
  const [photos, setPhotos] = useState<GardenPhoto[]>(note?.photos ?? []);

  const isValid = date.trim() !== '' && noteText.trim() !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    const formData: NoteFormData = {
      date: date.trim(),
      noteText: noteText.trim(),
      photos,
    };
    if (plantName.trim()) formData.plantName = plantName.trim();
    if (gardenLocation.trim()) formData.gardenLocation = gardenLocation.trim();
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
          Note <span className="text-red-500">*</span>
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          required
          rows={4}
          placeholder="What happened in the garden today?"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none
            focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
        <input
          type="text"
          value={plantName}
          onChange={(e) => setPlantName(e.target.value)}
          placeholder="e.g. Tomato, Basil…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Garden Location</label>
        <input
          type="text"
          value={gardenLocation}
          onChange={(e) => setGardenLocation(e.target.value)}
          placeholder="e.g. North bed, Greenhouse…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
        />
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
