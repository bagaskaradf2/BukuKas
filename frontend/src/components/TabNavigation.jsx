import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  CalendarClock, 
  Briefcase, 
  BookOpen, 
  Layers, 
  Settings 
} from 'lucide-react';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'KARTU IURAN', label: 'KARTU IURAN', icon: CreditCard },
  { id: 'RAB HARIAN', label: 'RAB HARIAN', icon: CalendarClock },
  { id: 'RAB PROKER', label: 'RAB PROKER', icon: Briefcase },
  { id: 'BB KAS', label: 'BB KAS', icon: BookOpen },
  { id: 'LAIN LAIN', label: 'LAIN LAIN', icon: Layers },
  { id: 'PENGATURAN', label: 'Pengaturan & Script', icon: Settings },
];

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="bg-[#FAF8F3] border-b border-[#E2DDCF] sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#123326] text-white shadow-xs'
                    : 'text-[#4A5D53] hover:text-[#123326] hover:bg-[#EAE5D9]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#74C69D]' : 'text-[#6C757D]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
