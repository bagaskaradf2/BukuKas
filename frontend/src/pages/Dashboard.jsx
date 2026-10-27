import React from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { 
  ArrowRight, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-violet-100 text-violet-800 border-violet-200',
];

export default function Dashboard() {
  const { data, setActiveTab, role, setIsRecordModalOpen } = useApp();

  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const totalDanaKelompok = kartuIuran.totalDanaKelompok || 17300000;

  const bbKasOktober = data?.bbKas?.OKTOBER || [];
  const latestTx = bbKasOktober.length > 0 ? bbKasOktober[bbKasOktober.length - 1] : null;
  const saldoSaatIni = latestTx ? latestTx.saldo : 16145000;
  const totalPengeluaranKas = bbKasOktober.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);

  const TARGET_PER_MEMBER = 1600000;

  return (
    <div className="space-y-6">
      
      {/* Header Bar with Action & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-zinc-950">
              Ringkasan Keuangan
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Google Sheets Live</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Pantau arus kas, rincian iuran, dan realisasi anggaran kelompok secara transparan
          </p>
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        )}
      </div>

      {/* 3 Metric Cards with Clean Color Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Saldo Kas Utama */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Saldo Kas Saat Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-zinc-950">
              {formatRupiah(saldoSaatIni)}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Sisa kas riil siap pakai di bendahara
            </span>
          </div>
        </div>

        {/* Card 2: Total Uang Masuk (Green / Emerald) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Total Uang Masuk
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700">
              {formatRupiah(totalDanaKelompok)}
            </div>
            <span className="text-[11px] text-emerald-800/70 mt-1 block font-medium">
              Akumulasi iuran 10 anggota & kas lain
            </span>
          </div>
        </div>

        {/* Card 3: Total Uang Keluar (Red / Rose) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/80 shadow-xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Total Uang Keluar
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-rose-600">
              {formatRupiah(totalPengeluaranKas)}
            </div>
            <span className="text-[11px] text-rose-800/70 mt-1 block font-medium">
              Pengeluaran konsumsi, posko & proker
            </span>
          </div>
        </div>

      </div>

      {/* 2 Main Sections: Status Iuran & Mutasi Kas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Status Iuran Anggota */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/40">
            <div>
              <h2 className="font-bold text-sm text-zinc-950">
                Status Iuran Anggota
              </h2>
              <span className="text-xs text-zinc-500 font-normal">
                Target iuran: <strong className="text-zinc-800 font-semibold">{formatRupiah(TARGET_PER_MEMBER)}</strong> / orang
              </span>
            </div>
            <button
              onClick={() => setActiveTab('KARTU IURAN')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-semibold inline-flex items-center space-x-1 cursor-pointer transition"
            >
              <span>Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {members.map((m, idx) => {
              const current = Number(m.total) || 0;
              const isOver = current > TARGET_PER_MEMBER;
              const isLunas = current >= TARGET_PER_MEMBER;
              const percent = Math.min(100, Math.round((current / TARGET_PER_MEMBER) * 100));
              const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <div key={idx} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/60 transition">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${avatarStyle}`}>
                      {m.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-900 block truncate">{m.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-20 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isLunas ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium tabular-nums">{percent}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div className="space-y-0.5">
                      <span className="tabular-nums font-bold text-zinc-950 block">
                        {formatRupiah(current)}
                      </span>
                      {isOver ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Lunas (Lebih)
                        </span>
                      ) : isLunas ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertCircle className="w-2.5 h-2.5 mr-1" />
                          Kurang {formatRupiah(TARGET_PER_MEMBER - current)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mutasi Kas Terkini */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/40">
            <div>
              <h2 className="font-bold text-sm text-zinc-950">
                Mutasi Kas Terbaru
              </h2>
              <span className="text-xs text-zinc-500 font-normal">
                Aktivitas pemasukan dan pengeluaran kas riil
              </span>
            </div>
            <button
              onClick={() => setActiveTab('BB KAS')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-semibold inline-flex items-center space-x-1 cursor-pointer transition"
            >
              <span>Buku Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {bbKasOktober.slice(-6).reverse().map((tx, idx) => {
              const isMasuk = tx.masuk > 0;

              return (
                <div key={idx} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/60 transition">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isMasuk ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-zinc-900 truncate">
                        {tx.deskripsi}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {tx.tanggal ? `Okt ${tx.tanggal}` : '-'} • Saldo: {formatRupiah(tx.saldo)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isMasuk ? (
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold tabular-nums text-emerald-700 block">
                          {formatRupiah(tx.masuk)}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                          Masuk
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold tabular-nums text-rose-600 block">
                          {formatRupiah(tx.keluar)}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 inline-block">
                          Keluar
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
