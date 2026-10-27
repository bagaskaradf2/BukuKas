import React from 'react';
import { useApp } from '../context/AppContext';
import { getLiveExcelDownloadUrl } from '../services/api';
import { 
  Download, 
  RefreshCw, 
  Shield, 
  Eye, 
  History
} from 'lucide-react';

export default function Navbar({ onOpenAudit }) {
  const { role, toggleRole, status, lastSync, refreshData, loading } = useApp();
  const excelUrl = getLiveExcelDownloadUrl();

  return (
    <header className="bg-[#0F291E] text-white border-b border-[#1A382B] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#1B4D3E] flex items-center justify-center text-white font-bold text-sm tracking-wide border border-[#2D6A4F]">
              BK
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-white">BukuKas</span>
              <span className="text-xs text-[#95D5B2] font-normal ml-2 hidden sm:inline">
                Sistem Pembukuan & Kas
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#091D15] border border-[#1A382B] text-xs">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="text-[#D8F3DC] font-medium">{status}</span>
              <span className="text-[#74C69D] text-[11px] opacity-75">{lastSync}</span>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refreshData()}
              disabled={loading}
              title="Sinkronkan dengan Google Sheets"
              className="p-1.5 rounded-md text-[#D8F3DC] hover:bg-[#1B4D3E] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Log Audit */}
            <button
              onClick={onOpenAudit}
              title="Riwayat Perubahan"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#1B4D3E] text-xs text-[#D8F3DC] font-medium transition"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            {/* Unduh Excel */}
            <a
              href={excelUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="KEUANGAN_LIVE.xlsx"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#25634F] text-xs font-medium text-white transition border border-[#2D6A4F]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Excel</span>
            </a>

            {/* Role Switcher */}
            <button
              onClick={toggleRole}
              title={`Beralih mode (Saat ini: ${role})`}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition border ${
                role === 'Bendahara'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
              }`}
            >
              {role === 'Bendahara' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bendahara</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pembaca</span>
                </>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
