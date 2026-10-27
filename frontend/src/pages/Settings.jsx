import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAppsScriptUrl, setAppsScriptUrl, getLiveExcelDownloadUrl } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Link, 
  Copy, 
  Check, 
  ExternalLink, 
  FileCode, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Server
} from 'lucide-react';

export default function Settings() {
  const { showToast, refreshData } = useApp();
  const [urlInput, setUrlInput] = useState(getAppsScriptUrl);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);

  const spreadsheetId = '1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao';
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const excelUrl = getLiveExcelDownloadUrl();

  const handleSaveUrl = () => {
    setAppsScriptUrl(urlInput);
    showToast('URL Google Apps Script berhasil disimpan!', 'success');
    refreshData();
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      showToast('Masukkan URL Apps Script terlebih dahulu!', 'error');
      return;
    }
    setTesting(true);
    try {
      const resp = await fetch(`${urlInput.trim()}?action=status`);
      const json = await resp.json();
      if (json && json.status === 'success') {
        showToast('Koneksi Google Apps Script berhasil terverifikasi!', 'success');
        setAppsScriptUrl(urlInput);
        refreshData();
      } else {
        showToast('Respon Apps Script diterima tetapi format tidak sesuai.', 'info');
      }
    } catch (err) {
      showToast('Gagal menghubungi Apps Script: ' + err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const copyScriptCode = () => {
    const scriptCode = `// Google Apps Script untuk BukuKas KKN
// Silakan buka file 'google-apps-script/Code.gs' di project repository untuk kode lengkap.`;
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('File Code.gs tersedia lengkap di direktori google-apps-script/Code.gs', 'info');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2DDCF] shadow-xs">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-[#2D6A4F]" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#123326] tracking-tight">PENGATURAN & KONEKSI GOOGLE SHEETS</h1>
        </div>
        <p className="text-xs text-[#6C757D] mt-1">
          Konfigurasi integrasi Google Sheets live, deployment Vercel, dan keamanan formula
        </p>
      </div>

      {/* Connection Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DDCF] shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#123326] flex items-center">
          <Server className="w-4 h-4 mr-2 text-[#2D6A4F]" />
          Informasi Spreadsheet Utama (Single Source of Truth)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE5D9]">
            <span className="text-[#6C757D] block mb-0.5">Spreadsheet ID</span>
            <span className="font-mono font-bold text-[#123326]">{spreadsheetId}</span>
          </div>

          <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE5D9] flex items-center justify-between">
            <div>
              <span className="text-[#6C757D] block mb-0.5">Tautan Langsung</span>
              <span className="font-semibold text-[#2D6A4F]">Google Sheets Live</span>
            </div>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#123326] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 hover:bg-[#1B4332]"
            >
              <span>Buka Sheets</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE5D9] flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-[#123326]">Unduh Kondisi Terkini (.xlsx)</span>
            <p className="text-[#6C757D]">Ekspor snapshot spreadsheet terbaru langsung dari Google Docs</p>
          </div>
          <a
            href={excelUrl}
            target="_blank"
            rel="noopener noreferrer"
            download="KEUANGAN_KKN_LIVE.xlsx"
            className="px-3.5 py-2 bg-[#2D6A4F] text-white rounded-lg font-semibold flex items-center space-x-1 hover:bg-[#40916C]"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Unduh Excel</span>
          </a>
        </div>
      </div>

      {/* Google Apps Script Web App Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DDCF] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#123326] flex items-center">
            <FileCode className="w-4 h-4 mr-2 text-[#2D6A4F]" />
            Integrasi Google Apps Script Web App (Rekomendasi Terbaik)
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Paling Efektif & Mudah
          </span>
        </div>

        <p className="text-xs text-[#52796F] leading-relaxed">
          Google Apps Script memungkinkan web menulis dan membaca langsung dari Google Sheets tanpa perlu akun Google Cloud Platform yang rumit. 
          Script berjalan langsung di dalam spreadsheet dan secara otomatis menjaga seluruh formula dan format tabel.
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#123326]">
            Web App URL (Akhiran /exec)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E2DDCF] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2.5 bg-[#123326] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition"
            >
              Simpan URL
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#EAE5D9] text-[#123326] border border-[#E2DDCF] text-xs font-semibold rounded-xl transition disabled:opacity-50"
            >
              {testing ? 'Menguji...' : 'Uji Koneksi'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DDCF] text-xs space-y-2 text-[#2D3748]">
          <h3 className="font-bold text-[#123326] flex items-center">
            <Info className="w-4 h-4 mr-1 text-[#2D6A4F]" />
            Langkah Cepat Memasang Apps Script di Spreadsheet Anda:
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-[#4A5D53] pl-1">
            <li>Buka Google Sheets Keuangan KKN Anda.</li>
            <li>Klik menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong>.</li>
            <li>Buka file <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2DDCF] font-mono text-[11px]">google-apps-script/Code.gs</code> di repository ini, lalu salin seluruh kodenya ke editor Apps Script.</li>
            <li>Klik icon <strong>Save (Simpan)</strong>.</li>
            <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong> di kanan atas.</li>
            <li>Pilih type <strong>Web app</strong>. Atur <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.</li>
            <li>Klik <strong>Deploy</strong>, lalu salin URL Web App yang berakhiran <code className="font-mono text-[#1B4332]">/exec</code> ke kolom di atas.</li>
          </ol>
        </div>
      </div>

      {/* Vercel Deployment Guide */}
      <div className="bg-[#123326] text-white p-6 rounded-2xl border border-[#0D281E] shadow-xs space-y-3">
        <h2 className="text-base font-bold flex items-center text-[#E8F5E9]">
          <ShieldCheck className="w-4 h-4 mr-2 text-[#74C69D]" />
          Panduan Deploy ke Vercel
        </h2>
        <p className="text-xs text-[#A7D7C5] leading-relaxed">
          Project ini sudah dikonfigurasi dengan file <code className="bg-[#1B4332] px-1.5 py-0.5 rounded font-mono text-white">vercel.json</code> dan kompatibel 100% untuk deploy satu klik ke Vercel!
        </p>
        <div className="space-y-1 text-xs text-[#D8F3DC]">
          <div>1. Push repository ini ke GitHub / GitLab.</div>
          <div>2. Buka dashboard Vercel, klik <strong>Add New &gt; Project</strong>, lalu pilih repo ini.</div>
          <div>3. Pada Environment Variables (Opsional): tambahkan <code className="font-mono text-amber-300">VITE_APPS_SCRIPT_URL</code> dengan URL Apps Script Anda.</div>
          <div>4. Klik <strong>Deploy</strong>. Selesai! Web akan live dan responsif di desktop maupun HP.</div>
        </div>
      </div>

    </div>
  );
}
