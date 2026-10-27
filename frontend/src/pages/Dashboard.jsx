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
    <div className="space-y-6">
      
      {/* Hero Header */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            Saldo Kas Berjalan
          </span>
          <div className="text-3xl sm:text-4xl font-bold tabular-nums text-zinc-950 mt-1">
            {formatRupiah(saldoSaatIni)}
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            Posisi kas riil terverifikasi dari Buku Kas
          </span>
        </div>

        {role === 'Bendahara' && (
          <div className="shrink-0">
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Pemasukan"
          amount={formatRupiah(totalDanaKelompok)}
          subtitle="Iuran anggota dan pendapatan lain"
        />
        <MetricCard
          title="Total Pengeluaran"
          amount={formatRupiah(totalPengeluaranKas)}
          subtitle={`${bbKasOktober.length} transaksi kas tercatat`}
        />
        <MetricCard
          title="Rencana Anggaran (RAB)"
          amount={formatRupiah(totalRabHarian + uangProker)}
          subtitle="RAB operasional dan program kerja"
        />
      </div>

      {/* 2 Equal Columns: Iuran Status & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Iuran per Member Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">
                Rekapitulasi Iuran
              </h2>
              <span className="text-[11px] text-zinc-500">Target baku: {formatRupiah(TARGET_PER_MEMBER)} / orang</span>
            </div>
            <button
              onClick={() => setActiveTab('KARTU IURAN')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium inline-flex items-center space-x-1"
            >
              <span>Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-medium text-[11px]">
                  <th className="py-2.5 px-4 text-center w-12">No</th>
                  <th className="py-2.5 px-4">Nama</th>
                  <th className="py-2.5 px-4 text-right">Terkumpul</th>
                  <th className="py-2.5 px-4 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((m, idx) => {
                  const current = Number(m.total) || 0;
                  const isOver = current > TARGET_PER_MEMBER;
                  const isLunas = current >= TARGET_PER_MEMBER;

                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-4 text-center text-zinc-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-zinc-900">{m.name}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-zinc-900">
                        {formatRupiah(current)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isOver ? (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Lunas (Lebih)
                          </span>
                        ) : isLunas ? (
                          <span className="text-[10px] font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                            Lunas
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Belum Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mutasi Kas Terkini */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">
                Mutasi Kas Terakhir
              </h2>
              <span className="text-[11px] text-zinc-500">6 transaksi kas terkonfirmasi</span>
            </div>
            <button
              onClick={() => setActiveTab('BB KAS')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium inline-flex items-center space-x-1"
            >
              <span>Buku Kas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-medium text-[11px]">
                  <th className="py-2.5 px-4 w-20">Tanggal</th>
                  <th className="py-2.5 px-4">Deskripsi</th>
                  <th className="py-2.5 px-4 text-right">Nominal</th>
                  <th className="py-2.5 px-4 text-right">Saldo Kas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {bbKasOktober.slice(-6).reverse().map((tx, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-4 text-zinc-500 text-[11px] whitespace-nowrap">
                      {tx.tanggal ? `Okt ${tx.tanggal}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-zinc-900">
                      {tx.deskripsi}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                      {tx.masuk > 0 ? (
                        <span className="text-emerald-700 font-medium">{formatRupiah(tx.masuk)}</span>
                      ) : (
                        <span className="text-zinc-900 font-medium">{formatRupiah(tx.keluar)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-zinc-950 whitespace-nowrap">
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
