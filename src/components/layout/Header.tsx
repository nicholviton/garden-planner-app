import { Leaf, Settings } from 'lucide-react';

interface HeaderProps {
  totalNotes: number;
  onSettingsClick: () => void;
}

export function Header({ totalNotes, onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-garden-700 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-garden-200" />
          <h1 className="text-lg font-bold tracking-tight">Garden Planner</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-garden-200">
            {totalNotes} {totalNotes === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={onSettingsClick}
            className="p-1.5 rounded-lg text-garden-200 hover:text-white hover:bg-garden-600 transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
