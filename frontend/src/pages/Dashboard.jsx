import React from 'react';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/MetricCard';
import { formatRupiah } from '../utils/formatters';
import { Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { data, setActiveTab, role, setIsRecordModalOpen } = useApp();

  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const totalDanaKelompok = kartuIuran.totalDanaKelompok || 17300000;
  const uangProker = kartuIuran.uangProker || 7000000;

  const bbKasOktober = data?.bbKas?.OKTOBER || [];
  const latestTx = bbKasOktober.length > 0 ? bbKasOktober[bbKasOktober.length - 1] : null;
  const saldoSaatIni = latestTx ? latestTx.saldo : 16145000;
  const totalPengeluaranKas = bbKasOktober.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);

  const rabHarian = data?.rabHarian || [];
  const totalRabHarian = rabHarian.reduce((acc, cat) => acc + (Number(cat.total) || 0), 0);

  const TARGET_PER_MEMBER = 1600000;

  return (
    <div className="space-y-5">
      
      {/* Hero Header with Primary Action Button */}
      <div className="bg-white p-5 rounded-lg border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Saldo Kas Berjalan
          </span>
          <div className="text-3xl font-bold tabular-nums text-zinc-950 mt-1">
            {formatRupiah(saldoSaatIni)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Tercatat di Buku Kas • Mutasi kas aktif
          </span>
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Catat Transaksi Baru</span>
          </button>
        )}
      </div>

      {/* 3 Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="Total Pemasukan"
          amount={formatRupiah(totalDanaKelompok)}
          subtitle="Iuran 10 anggota & kas masuk"
        />
        <MetricCard
          title="Total Pengeluaran"
          amount={formatRupiah(totalPengeluaranKas)}
          subtitle={`${bbKasOktober.length} mutasi kas keluar`}
        />
        <MetricCard
          title="Rencana Anggaran (RAB)"
          amount={formatRupiah(totalRabHarian + uangProker)}
          subtitle="RAB Harian + Alokasi Proker"
        />
      </div>

      {/* 2 Clean Sections: Iuran & Recent Kas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Progress Iuran Anggota */}
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">
              Iuran per Anggota
            </h2>
            <button
              onClick={() => setActiveTab('KARTU IURAN')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium inline-flex items-center space-x-1"
            >
              <span>Detail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 divide-y divide-zinc-100">
            {members.map((m, idx) => {
              const current = Number(m.total) || 0;
              const isOver = current > TARGET_PER_MEMBER;
              const isLunas = current >= TARGET_PER_MEMBER;

              return (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-zinc-900">{m.name}</span>
                  </div>

                  <div className="text-right flex items-center space-x-2">
                    <span className="tabular-nums font-semibold text-zinc-900">
                      {formatRupiah(current)}
                    </span>
                    {isOver ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Lunas (+400rb)
                      </span>
                    ) : isLunas ? (
                      <span className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded">
                        Lunas
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
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
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">
              Mutasi Kas Terakhir
            </h2>
            <button
              onClick={() => setActiveTab('BB KAS')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium inline-flex items-center space-x-1"
            >
              <span>Buku Kas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-medium text-[11px]">
                  <th className="py-2 px-3">Tgl</th>
                  <th className="py-2 px-3">Keterangan</th>
                  <th className="py-2 px-3 text-right">Keluar/Masuk</th>
                  <th className="py-2 px-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {bbKasOktober.slice(-6).reverse().map((tx, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="py-2 px-3 text-zinc-500 text-[11px]">
                      {tx.tanggal ? `Okt ${tx.tanggal}` : '-'}
                    </td>
                    <td className="py-2 px-3 font-medium text-zinc-900 truncate max-w-[150px]">
                      {tx.deskripsi}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {tx.masuk > 0 ? (
                        <span className="text-emerald-700 font-medium">+{formatRupiah(tx.masuk)}</span>
                      ) : (
                        <span className="text-zinc-900 font-medium">-{formatRupiah(tx.keluar)}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-zinc-950">
                      {formatRupiah(tx.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
