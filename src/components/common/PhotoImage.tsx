import type { GardenPhoto } from '@/types/note';
import { useGitHubConfig } from '@/contexts/GitHubConfigContext';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';

interface PhotoImageProps {
  photo: GardenPhoto;
  className?: string;
}

export function PhotoImage({ photo, className }: PhotoImageProps) {
  const config = useGitHubConfig();
  const { dataUrl: fetchedUrl, isLoading } = usePhotoUrl(
    // Only fetch if there's no inline dataUrl already
    photo.dataUrl ? null : config,
    photo.dataUrl ? undefined : photo.path,
  );

  const src = photo.dataUrl ?? fetchedUrl;

  if (!src) {
    return (
      <div
        className={`${className ?? ''} bg-gray-100 animate-pulse`}
        aria-label="Loading photo…"
      />
    );
  }

  return (
    <img
      src={src}
      alt={photo.fileName}
      className={className}
      aria-busy={isLoading}
    />
  );
}
