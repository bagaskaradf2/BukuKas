import React from 'react';
import { useApp } from '../context/AppContext';
import { getLiveExcelDownloadUrl } from '../services/api';
import { Download, RefreshCw, History, Shield, Eye } from 'lucide-react';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'KARTU IURAN', label: 'Kartu Iuran' },
  { id: 'RAB HARIAN', label: 'RAB Harian' },
  { id: 'RAB PROKER', label: 'RAB Proker' },
  { id: 'BB KAS', label: 'Buku Kas' },
  { id: 'LAIN LAIN', label: 'Lain-Lain' },
];

export default function Navbar({ onOpenAudit }) {
  const { activeTab, setActiveTab, role, toggleRole, lastSync, refreshData, loading } = useApp();
  const excelUrl = getLiveExcelDownloadUrl();

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Navigation Tabs (Desktop) */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className="font-bold text-base tracking-tight text-zinc-950 flex items-center space-x-2"
            >
              <span className="w-6 h-6 rounded bg-zinc-950 text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              <span>BukuKas</span>
            </button>

            <nav className="hidden md:flex items-center space-x-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
              <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
              <span>{lastSync}</span>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refreshData()}
              disabled={loading}
              title="Perbarui data"
              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Audit Log */}
            <button
              onClick={onOpenAudit}
              title="Riwayat audit"
              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition"
            >
              <History className="w-3.5 h-3.5" />
            </button>

            {/* Unduh Excel */}
            <a
              href={excelUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="KEUANGAN_LIVE.xlsx"
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              <Download className="w-3 h-3 text-zinc-500" />
              <span>Unduh .xlsx</span>
            </a>

            {/* Role Switcher */}
            <button
              onClick={toggleRole}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition"
            >
              {role === 'Bendahara' ? (
                <>
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Bendahara</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-zinc-400" />
                  <span>Pembaca</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden space-x-1 overflow-x-auto py-2 border-t border-zinc-100 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
