import React from 'react';
import { useApp } from '../context/AppContext';
import { getLiveExcelDownloadUrl, getLiveSpreadsheetUrl } from '../services/api';
import { Download, Shield, ExternalLink, LogIn, LogOut } from 'lucide-react';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'KARTU IURAN', label: 'Kartu Iuran' },
  { id: 'RAB HARIAN', label: 'RAB Harian' },
  { id: 'RAB PROKER', label: 'RAB Proker' },
  { id: 'BB KAS', label: 'Buku Kas' },
  { id: 'LAIN LAIN', label: 'Lain-Lain' },
];

export default function Navbar() {
  const { activeTab, setActiveTab, role, logout, setIsLoginModalOpen } = useApp();
  const excelUrl = getLiveExcelDownloadUrl();
  const spreadsheetUrl = getLiveSpreadsheetUrl();

  return (
    <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className="cursor-pointer text-left"
            >
              <span className="font-bold text-lg tracking-tight text-zinc-950 block">
                BukuKas
              </span>
            </button>

            <nav className="hidden md:flex items-center space-x-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-zinc-950 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2.5">
            
            {/* Unduh Excel */}
            <a
              href={excelUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="KEUANGAN_LIVE.xlsx"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Unduh Excel</span>
            </a>

            {/* Mode Bendahara Controls */}
            {role === 'Bendahara' ? (
              <div className="flex items-center space-x-2">
                {/* Tombol Direct ke Google Spreadsheet */}
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/90 text-xs font-semibold transition cursor-pointer shadow-2xs"
                  title="Buka Google Spreadsheet Live"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Spreadsheet</span>
                </a>

                {/* Badge Status Bendahara & Tombol Keluar */}
                <div className="flex items-center space-x-1">
                  <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 text-zinc-800 text-xs font-semibold">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bendahara</span>
                  </span>
                  <button
                    onClick={logout}
                    title="Keluar dari akun Bendahara"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Mode Pembaca: Tombol Login Bendahara */
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Login Bendahara</span>
              </button>
            )}

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
