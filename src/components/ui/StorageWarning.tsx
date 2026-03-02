import { AlertTriangle } from 'lucide-react';

interface StorageWarningProps {
  usageKb: number;
}

const WARN_KB = 4 * 1024;   // 4 MB
const CRITICAL_KB = 9 * 1024; // 9 MB

export function StorageWarning({ usageKb }: StorageWarningProps) {
  if (usageKb < WARN_KB) return null;

  const isCritical = usageKb >= CRITICAL_KB;
  const usageMb = (usageKb / 1024).toFixed(1);

  return (
    <div
      className={[
        'flex items-center gap-2 px-4 py-2 text-sm font-medium',
        isCritical
          ? 'bg-red-100 text-red-800 border-b border-red-200'
          : 'bg-earth-100 text-earth-800 border-b border-earth-200',
      ].join(' ')}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      {isCritical
        ? `Storage critically full (${usageMb} MB). Delete notes with photos to free space.`
        : `Storage usage is high (${usageMb} MB). Consider deleting old notes.`}
    </div>
  );
}
