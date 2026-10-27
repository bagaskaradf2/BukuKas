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
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">
            Ringkasan Keuangan
          </h1>
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Catat Transaksi</span>
          </button>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Saldo Kas Utama */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Saldo Kas Saat Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-zinc-950">
              {formatRupiah(saldoSaatIni)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Sisa kas riil siap pakai di bendahara
            </span>
          </div>
        </div>

        {/* Card 2: Total Uang Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Uang Masuk
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700">
              {formatRupiah(totalDanaKelompok)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Akumulasi iuran anggota & kas lain
            </span>
          </div>
        </div>

        {/* Card 3: Total Uang Keluar (Merah) */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Uang Keluar
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-rose-600">
              {formatRupiah(totalPengeluaranKas)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Pengeluaran konsumsi, posko & proker
            </span>
          </div>
        </div>

      </div>

      {/* 2 Main Sections: Status Iuran & Mutasi Kas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Status Iuran Anggota */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="font-bold text-sm text-zinc-950">
                Status Iuran Anggota
              </h2>
              <span className="text-xs text-zinc-400 font-normal">
                Target iuran: <strong className="text-zinc-700 font-semibold">{formatRupiah(TARGET_PER_MEMBER)}</strong> / orang
              </span>
            </div>
            <button
              onClick={() => setActiveTab('KARTU IURAN')}
              className="text-xs text-zinc-500 hover:text-zinc-950 font-semibold inline-flex items-center space-x-1 cursor-pointer transition"
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

              return (
                <div key={idx} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/60 transition">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 font-semibold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-900 truncate">{m.name}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <span className="tabular-nums font-bold text-zinc-950">
                      {formatRupiah(current)}
                    </span>
                    {isOver ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Lunas (Lebih)
                      </span>
                    ) : isLunas ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        <AlertCircle className="w-2.5 h-2.5 mr-1" />
                        Kurang {formatRupiah(TARGET_PER_MEMBER - current)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mutasi Kas Terkini */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="font-bold text-sm text-zinc-950">
                Mutasi Kas Terbaru
              </h2>
              <span className="text-xs text-zinc-400 font-normal">
                Aktivitas pemasukan dan pengeluaran kas riil
              </span>
            </div>
            <button
              onClick={() => setActiveTab('BB KAS')}
              className="text-xs text-zinc-500 hover:text-zinc-950 font-semibold inline-flex items-center space-x-1 cursor-pointer transition"
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
                      isMasuk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
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
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 inline-block">
                          Masuk
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold tabular-nums text-rose-600 block">
                          {formatRupiah(tx.keluar)}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 inline-block">
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
