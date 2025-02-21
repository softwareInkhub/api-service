'use client';

interface TabHeaderProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabHeader({ tabs, activeTab, onTabChange }: TabHeaderProps) {
  return (
    <div className="border-b mb-6">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-4 px-1 relative ${
              activeTab === tab
                ? 'text-[#ff6b4a] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b4a]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 