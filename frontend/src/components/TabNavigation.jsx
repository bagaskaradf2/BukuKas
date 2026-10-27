import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  CalendarClock, 
  Briefcase, 
  BookOpen, 
  Layers
} from 'lucide-react';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'KARTU IURAN', label: 'Kartu Iuran', icon: CreditCard },
  { id: 'RAB HARIAN', label: 'RAB Harian', icon: CalendarClock },
  { id: 'RAB PROKER', label: 'RAB Proker', icon: Briefcase },
  { id: 'BB KAS', label: 'Buku Kas', icon: BookOpen },
  { id: 'LAIN LAIN', label: 'Lain-Lain', icon: Layers }
];

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="bg-white border-b border-[#E2E8F0] sticky top-14 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#0F291E] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F291E] hover:bg-[#F1F5F9]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#74C69D]' : 'text-[#94A3B8]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
