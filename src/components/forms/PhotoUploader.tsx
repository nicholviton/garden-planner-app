import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import type { GardenPhoto } from '@/types/note';
import { compressAndEncodeImage } from '@/lib/imageUtils';
import { PhotoPreview } from './PhotoPreview';

const MAX_PHOTOS = 5;

interface PhotoUploaderProps {
  photos: GardenPhoto[];
  onChange: (photos: GardenPhoto[]) => void;
}

export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    const toProcess = Array.from(files).slice(0, remaining);
    setLoading(true);
    try {
      const compressed = await Promise.all(toProcess.map(compressAndEncodeImage));
      onChange([...photos, ...compressed]);
    } catch {
      setError('Failed to process one or more images.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-2">
        {photos.map((p) => (
          <PhotoPreview key={p.id} photo={p} onRemove={removePhoto} />
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-20 h-20 border-2 border-dashed border-garden-300 rounded-lg
              flex flex-col items-center justify-center gap-1 text-garden-600
              hover:border-garden-500 hover:bg-garden-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs">Add</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS} photos</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
