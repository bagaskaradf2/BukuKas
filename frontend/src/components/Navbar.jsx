import React from 'react';
import { useApp } from '../context/AppContext';
import { getLiveExcelDownloadUrl } from '../services/api';
import { Download, Shield, Eye } from 'lucide-react';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'KARTU IURAN', label: 'Kartu Iuran' },
  { id: 'RAB HARIAN', label: 'RAB Harian' },
  { id: 'RAB PROKER', label: 'RAB Proker' },
  { id: 'BB KAS', label: 'Buku Kas' },
  { id: 'LAIN LAIN', label: 'Lain-Lain' },
];

export default function Navbar() {
  const { activeTab, setActiveTab, role, toggleRole, lastSync } = useApp();
  const excelUrl = getLiveExcelDownloadUrl();

  return (
    <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className="flex items-center space-x-2.5 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-bold text-sm flex items-center justify-center">
                B
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-zinc-950 block leading-tight">
                  BukuKas
                </span>
                <span className="text-[10px] text-zinc-400 block font-normal">
                  Google Sheets Live
                </span>
              </div>
            </button>

            <nav className="hidden md:flex items-center space-x-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Unduh Excel */}
            <a
              href={excelUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="KEUANGAN_LIVE.xlsx"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Unduh Excel</span>
            </a>

            {/* Role Switcher */}
            <button
              onClick={toggleRole}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-medium transition cursor-pointer"
            >
              {role === 'Bendahara' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bendahara</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Pembaca</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden space-x-1 overflow-x-auto py-2 border-t border-zinc-100 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-100'
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
