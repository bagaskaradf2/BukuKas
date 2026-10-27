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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-[#1E293B]">
      {/* Header */}
      <Navbar onOpenAudit={() => setIsAuditOpen(true)} />

      {/* Tabs */}
      <TabNavigation />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {renderActivePage()}
      </main>

      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => {}} />

      {/* Audit Modal */}
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-3 text-center text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <span>BukuKas — Sistem Pembukuan Terintegrasi</span>
          <span>Google Sheets Live Source</span>
        </div>
      </footer>
    </div>
  );
}
