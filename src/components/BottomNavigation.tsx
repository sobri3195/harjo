
import React, { useCallback, useMemo } from 'react';
import { Home, Users, History, UserPlus, Settings } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = React.memo(({ activeTab, onTabChange }) => {
  // Memoize nav items to prevent recreation on every render
  const navItems = useMemo(() => [
    { id: 'home', icon: Home, label: 'Beranda' },
    { id: 'register', icon: UserPlus, label: 'Daftar' },
    { id: 'history', icon: History, label: 'Riwayat' },
    { id: 'team', icon: Users, label: 'Tim Medis' },
    { id: 'settings', icon: Settings, label: 'Pengaturan' },
  ], []);

  // Optimized tab change handler - no redundant hash updates
  const handleTabChange = useCallback((tabId: string) => {
    // Prevent unnecessary updates if already active
    if (tabId === activeTab) return;
    
    onTabChange(tabId);
    // Only update hash if different from current
    if (window.location.hash.slice(1) !== tabId) {
      window.history.replaceState(null, '', `#${tabId}`);
    }
  }, [activeTab, onTabChange]);

  // Memoized navigation items to prevent re-renders
  const navigationItems = useMemo(() => 
    navItems.map((item) => {
      const IconComponent = item.icon;
      const isActive = activeTab === item.id;
      
      return (
        <button
          key={item.id}
          onClick={() => handleTabChange(item.id)}
          className={`
            flex flex-col items-center py-2 px-3 rounded-lg
            transition-colors duration-150 ease-out
            transform-gpu will-change-transform
            ${isActive
              ? 'text-navy-blue-600 bg-navy-blue-50 scale-105'
              : 'text-gray-600 hover:text-navy-blue-500 hover:bg-gray-50'
            }
          `}
          aria-label={item.label}
          aria-pressed={isActive}
        >
          <IconComponent size={20} className="shrink-0" />
          <span className="text-xs mt-1 font-medium truncate">{item.label}</span>
        </button>
      );
    }), [navItems, activeTab, handleTabChange]
  );

  return (
    <nav 
      className="bottom-nav bg-white/90 border-t border-gray-200/60 shadow-lg"
      style={{ 
        contain: 'layout style paint',
        willChange: 'transform'
      }}
    >
      <div className="flex justify-around items-center py-2 px-1">
        {navigationItems}
      </div>
    </nav>
  );
});

export default BottomNavigation;
