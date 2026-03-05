interface TabBarProps {
  activeTab: 'notes' | 'layout';
  onTabChange: (tab: 'notes' | 'layout') => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex gap-0">
        {(['notes', 'layout'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={[
              'px-5 py-3 text-sm border-b-2 transition-colors',
              activeTab === tab
                ? 'border-garden-600 text-garden-700 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab === 'notes' ? 'Notes' : 'Garden Layout'}
          </button>
        ))}
      </div>
    </div>
  );
}
