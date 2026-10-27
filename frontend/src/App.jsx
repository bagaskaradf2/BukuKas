import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AuditModal from './components/AuditModal';
import RecordModal from './components/RecordModal';

import Dashboard from './pages/Dashboard';
import KartuIuran from './pages/KartuIuran';
import RabHarian from './pages/RabHarian';
import RabProker from './pages/RabProker';
import BbKas from './pages/BbKas';
import LainLain from './pages/LainLain';

export default function App() {
  const { activeTab, toast, isRecordModalOpen, setIsRecordModalOpen } = useApp();
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-zinc-900">
      <Navbar onOpenAudit={() => setIsAuditOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {renderActivePage()}
      </main>

      <Toast toast={toast} onClose={() => {}} />
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <RecordModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />

      <footer className="border-t border-zinc-200 bg-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] text-zinc-500">
          <span>BukuKas — Sistem Pembukuan Terintegrasi</span>
          <span>Google Sheets Live Source</span>
        </div>
      </footer>
    </div>
  );
}
