
import React from 'react';
import { Home, Activity, Navigation, Users, Settings, Phone } from 'lucide-react';

interface AmbulanceBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AmbulanceBottomNavigation: React.FC<AmbulanceBottomNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Beranda' },
    { id: 'emergency', icon: Phone, label: 'Emergency' },
    { id: 'status', icon: Activity, label: 'Status' },
    { id: 'navigation', icon: Navigation, label: 'Navigasi' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav bg-white/95 backdrop-blur-md border-t border-emergency-red-200">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-emergency-red-600 bg-emergency-red-50'
                  : 'text-gray-600 hover:text-emergency-red-500'
              }`}
            >
              <IconComponent size={20} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AmbulanceBottomNavigation;
