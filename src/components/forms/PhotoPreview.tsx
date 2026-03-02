import { X } from 'lucide-react';
import type { GardenPhoto } from '@/types/note';
import { PhotoImage } from '@/components/common/PhotoImage';

interface PhotoPreviewProps {
  photo: GardenPhoto;
  onRemove: (id: string) => void;
}

export function PhotoPreview({ photo, onRemove }: PhotoPreviewProps) {
  return (
    <div className="relative group">
      <PhotoImage
        photo={photo}
        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors" />
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full
          flex items-center justify-center hover:bg-red-600 transition-colors shadow"
        aria-label="Remove photo"
      >
        <X className="w-3 h-3" />
      </button>
      <p className="text-xs text-gray-500 mt-1 w-20 truncate">{photo.sizeKb} KB</p>
    </div>
  );
}
