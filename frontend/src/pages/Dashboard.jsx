import React from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { ArrowRight, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
      
      {/* Hero Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Saldo Kas Saat Ini
          </span>
          <div className="text-3xl sm:text-4xl font-bold tabular-nums text-zinc-950 mt-1">
            {formatRupiah(saldoSaatIni)}
          </div>
          <span className="text-xs text-zinc-500 mt-1.5 block">
            Saldo riil terverifikasi dari Buku Kas
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center space-x-6 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Total Masuk
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-700">
                {formatRupiah(totalDanaKelompok)}
              </span>
            </div>
            <div className="w-px h-8 bg-zinc-200"></div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Total Keluar
              </span>
              <span className="text-sm font-bold tabular-nums text-zinc-900">
                {formatRupiah(totalPengeluaranKas)}
              </span>
            </div>
          </div>

          {role === 'Bendahara' && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Catat Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* 2 Equal Columns: Iuran Status & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Iuran per Member Table */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-zinc-900">
                Status Iuran Anggota
              </h2>
              <span className="text-xs text-zinc-400 font-normal">Target {formatRupiah(TARGET_PER_MEMBER)} / orang</span>
            </div>
            <button
              onClick={() => setActiveTab('KARTU IURAN')}
              className="text-xs text-zinc-500 hover:text-zinc-950 font-medium inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {members.map((m, idx) => {
              const current = Number(m.total) || 0;
              const isOver = current > TARGET_PER_MEMBER;
              const isLunas = current >= TARGET_PER_MEMBER;

              return (
                <div key={idx} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/50 transition">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-900">{m.name}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="tabular-nums font-semibold text-zinc-900">
                      {formatRupiah(current)}
                    </span>
                    {isOver ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Lunas (Lebih)
                      </span>
                    ) : isLunas ? (
                      <span className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full">
                        Lunas
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        Kurang
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mutasi Kas Terkini */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-zinc-900">
                Mutasi Kas Terbaru
              </h2>
              <span className="text-xs text-zinc-400 font-normal">6 mutasi kas terakhir</span>
            </div>
            <button
              onClick={() => setActiveTab('BB KAS')}
              className="text-xs text-zinc-500 hover:text-zinc-950 font-medium inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Buku Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {bbKasOktober.slice(-6).reverse().map((tx, idx) => (
              <div key={idx} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/50 transition">
                <div className="space-y-0.5">
                  <div className="font-semibold text-zinc-900">
                    {tx.deskripsi}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {tx.tanggal ? `Okt ${tx.tanggal}` : '-'} • Saldo: {formatRupiah(tx.saldo)}
                  </div>
                </div>

                <div className="text-right">
                  {tx.masuk > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold tabular-nums text-emerald-700 block">
                        {formatRupiah(tx.masuk)}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 inline-block">
                        Masuk
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold tabular-nums text-zinc-800 block">
                        {formatRupiah(tx.keluar)}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded inline-block">
                        Keluar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
