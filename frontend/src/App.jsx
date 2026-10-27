import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import TabNavigation from './components/TabNavigation';
import Toast from './components/Toast';
import AuditModal from './components/AuditModal';

import Dashboard from './pages/Dashboard';
import KartuIuran from './pages/KartuIuran';
import RabHarian from './pages/RabHarian';
import RabProker from './pages/RabProker';
import BbKas from './pages/BbKas';
import LainLain from './pages/LainLain';
import Settings from './pages/Settings';

export default function App() {
  const { activeTab, toast } = useApp();
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <Dashboard />;
      case 'KARTU IURAN':
        return <KartuIuran />;
      case 'RAB HARIAN':
        return <RabHarian />;
      case 'RAB PROKER':
        return <RabProker />;
      case 'BB KAS':
        return <BbKas />;
      case 'LAIN LAIN':
        return <LainLain />;
      case 'PENGATURAN':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col selection:bg-[#1B4332] selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenAudit={() => setIsAuditOpen(true)} />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderActivePage()}
      </main>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => {}} />

      {/* Audit Modal */}
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

      {/* Simple Footer */}
      <footer className="bg-[#FAF8F3] border-t border-[#E2DDCF] py-4 text-center text-xs text-[#6C757D]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BukuKas KKN M UNY 2026/2027 • Padukuhan Pengkol, Sriharjo</span>
          <span className="text-[#8D99AE]">Single Source of Truth: Google Sheets Live</span>
        </div>
      </footer>
    </div>
  );
}
