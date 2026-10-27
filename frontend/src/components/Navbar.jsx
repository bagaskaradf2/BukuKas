import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLiveExcelDownloadUrl } from '../services/api';
import { 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  ExternalLink, 
  History, 
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ onOpenAudit }) {
  const { role, toggleRole, status, lastSync, refreshData, loading, dataSource } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const excelUrl = getLiveExcelDownloadUrl();

  return (
    <header className="bg-[#123326] text-white border-b border-[#0A1F17] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Identitas */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white shadow-inner font-bold text-lg tracking-wider border border-[#40916C]">
              BK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-[#E8F5E9]">BukuKas KKN</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#1B4332] text-[#A7D7C5] border border-[#2D6A4F]">
                  M UNY
                </span>
              </div>
              <p className="text-xs text-[#95D5B2] font-medium hidden sm:block">
                Pengkol, Sriharjo • Sub-Source: Google Sheets
              </p>
            </div>
          </div>

          {/* Status & Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Status Sync Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0D281E] border border-[#2D6A4F]/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="text-[#D8F3DC] font-medium">{status}</span>
              <span className="text-[#74C69D] text-[11px] flex items-center">
                <Clock className="w-3 h-3 ml-1 mr-0.5 inline opacity-70" />
                {lastSync}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refreshData()}
              disabled={loading}
              title="Perbarui Data dari Google Sheets"
              className="p-2 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-[#D8F3DC] transition border border-[#2D6A4F] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Audit Log Button */}
            <button
              onClick={onOpenAudit}
              title="Lihat Log Audit & Riwayat Perubahan"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-xs text-[#D8F3DC] font-medium transition border border-[#2D6A4F]"
            >
              <History className="w-3.5 h-3.5" />
              <span>Log Audit</span>
            </button>

            {/* Unduh Excel (.xlsx) */}
            <a
              href={excelUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="KEUANGAN_KKN_LIVE.xlsx"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#2D6A4F] hover:bg-[#40916C] text-xs font-semibold text-white shadow-sm transition border border-[#52B788]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel (.xlsx)</span>
            </a>

            {/* Role Switcher */}
            <button
              onClick={toggleRole}
              title={`Klik untuk berganti ke mode ${role === 'Bendahara' ? 'Pembaca' : 'Bendahara'}`}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                role === 'Bendahara'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
              }`}
            >
              {role === 'Bendahara' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akses: Bendahara</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Akses: Pembaca</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => refreshData()}
              disabled={loading}
              className="p-1.5 rounded bg-[#1B4332] text-[#D8F3DC]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#1B4332] text-[#D8F3DC]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#1B4332] space-y-2">
            <div className="flex items-center justify-between py-1 text-xs text-[#A7D7C5]">
              <span>Status: {status}</span>
              <span>Sync: {lastSync}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={excelUrl}
                download="KEUANGAN_KKN_LIVE.xlsx"
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded bg-[#2D6A4F] text-xs font-semibold text-white text-center"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Unduh Excel</span>
              </a>
              <button
                onClick={toggleRole}
                className="py-2 px-3 rounded bg-[#1B4332] text-xs font-semibold text-[#D8F3DC] text-center border border-[#2D6A4F]"
              >
                Mode: {role}
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
