import React from 'react';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/MetricCard';
import { formatRupiah } from '../utils/formatters';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { data, setActiveTab } = useApp();

  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const totalDanaKelompok = kartuIuran.totalDanaKelompok || 17300000;
  const uangProker = kartuIuran.uangProker || 7000000;

  // Kas calculations from BB KAS
  const bbKasOktober = data?.bbKas?.OKTOBER || [];
  const latestTx = bbKasOktober.length > 0 ? bbKasOktober[bbKasOktober.length - 1] : null;
  const saldoSaatIni = latestTx ? latestTx.saldo : 16145000;
  const totalPengeluaranKas = bbKasOktober.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);

  // Total RAB Harian
  const rabHarian = data?.rabHarian || [];
  const totalRabHarian = rabHarian.reduce((acc, cat) => acc + (Number(cat.total) || 0), 0);

  const TARGET_PER_MEMBER = 1600000;
  const completedMembers = members.filter(m => (Number(m.total) || 0) >= TARGET_PER_MEMBER).length;

  return (
    <div className="space-y-5 pb-10">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Saldo Kas Saat Ini"
          amount={formatRupiah(saldoSaatIni)}
          subtitle="Buku Kas Terkini"
          icon={Wallet}
          variant="forest"
          badge="Live"
        />
        <MetricCard
          title="Total Pemasukan"
          amount={formatRupiah(totalDanaKelompok)}
          subtitle="Iuran & Pendapatan Lain"
          icon={ArrowUpRight}
        />
        <MetricCard
          title="Total Pengeluaran"
          amount={formatRupiah(totalPengeluaranKas)}
          subtitle={`${bbKasOktober.length} transaksi kas tercatat`}
          icon={ArrowDownRight}
        />
        <MetricCard
          title="Total Rencana Anggaran"
          amount={formatRupiah(totalRabHarian + uangProker)}
          subtitle="RAB Harian + Alokasi Proker"
          icon={PieChart}
        />
      </div>

      {/* Main Grid: Iuran Progress & Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Progress Iuran Anggota (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-sm font-semibold text-[#0F291E]">Ringkasan Iuran Anggota</h2>
              <p className="text-xs text-[#64748B]">Target wajib: {formatRupiah(TARGET_PER_MEMBER)} / anggota</p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              {completedMembers} dari {members.length} Tercapai
            </span>
          </div>

          <div className="mt-3.5 divide-y divide-[#F1F5F9]">
            {members.map((m, idx) => {
              const current = Number(m.total) || 0;
              const percentage = Math.min(100, Math.round((current / TARGET_PER_MEMBER) * 100));
              const isOver = current > TARGET_PER_MEMBER;
              return (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 w-1/3 min-w-[120px]">
                    <span className="w-5 h-5 rounded bg-[#F1F5F9] text-[#64748B] text-[11px] font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[#1E293B] truncate">{m.name}</span>
                  </div>

                  <div className="flex-1 px-4 hidden sm:block">
                    <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${percentage >= 100 ? 'bg-[#0F291E]' : 'bg-amber-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="tabular-nums font-semibold text-[#0F291E]">
                      {formatRupiah(current)}
                    </span>
                    {isOver && (
                      <span className="text-[10px] text-emerald-600 font-medium ml-1.5">
                        (+{formatRupiah(current - TARGET_PER_MEMBER)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <button
              onClick={() => setActiveTab('KARTU IURAN')}
              className="text-[#0F291E] font-medium hover:underline inline-flex items-center space-x-1"
            >
              <span>Buka Kartu Iuran Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="tabular-nums font-medium text-[#0F291E]">
              Total Masuk: {formatRupiah(totalDanaKelompok)}
            </span>
          </div>
        </div>

        {/* Ringkasan Anggaran (1 Col) */}
        <div className="space-y-5">
          
          {/* RAB Harian Box */}
          <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-2xs">
            <h2 className="text-sm font-semibold text-[#0F291E] mb-3">RAB Kebutuhan Harian</h2>
            <div className="space-y-2 text-xs">
              {rabHarian.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#F8F9FA] last:border-0">
                  <span className="text-[#64748B]">{cat.category.replace('RAB ', '')}</span>
                  <span className="tabular-nums font-medium text-[#1E293B]">{formatRupiah(cat.total)}</span>
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between font-semibold text-[#0F291E] text-xs border-t border-[#E2E8F0]">
                <span>Total Harian</span>
                <span className="tabular-nums">{formatRupiah(totalRabHarian)}</span>
              </div>
            </div>
          </div>

          {/* Alokasi Proker Card */}
          <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase">Alokasi Program Kerja</span>
              <span className="text-xs font-semibold tabular-nums text-[#0F291E]">{formatRupiah(uangProker)}</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1.5">
              Dialokasikan untuk 9 blok program kerja terencana.
            </p>
            <button
              onClick={() => setActiveTab('RAB PROKER')}
              className="mt-3.5 w-full py-2 px-3 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F291E] text-xs font-medium transition text-center"
            >
              Lihat Detail RAB Proker &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* Aktivitas Terakhir di Buku Kas */}
      <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-sm font-semibold text-[#0F291E]">Transaksi Terkini di Buku Kas</h2>
            <p className="text-xs text-[#64748B]">Menampilkan mutasi kas terbaru (Oktober)</p>
          </div>
          <button
            onClick={() => setActiveTab('BB KAS')}
            className="text-xs font-medium text-[#0F291E] hover:underline inline-flex items-center space-x-1"
          >
            <span>Buku Kas Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px]">
                <th className="py-2 px-3 font-semibold w-16">Tanggal</th>
                <th className="py-2 px-3 font-semibold">Deskripsi</th>
                <th className="py-2 px-3 font-semibold text-right w-28">Masuk</th>
                <th className="py-2 px-3 font-semibold text-right w-28">Keluar</th>
                <th className="py-2 px-3 font-semibold text-right w-32">Saldo</th>
                <th className="py-2 px-3 font-semibold w-24">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {bbKasOktober.slice(-6).reverse().map((tx, idx) => (
                <tr key={idx} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="py-2 px-3 text-[#64748B]">
                    {tx.tanggal ? `Okt ${tx.tanggal}` : '-'}
                  </td>
                  <td className="py-2 px-3 font-medium text-[#1E293B]">{tx.deskripsi}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-emerald-700 font-medium">
                    {tx.masuk > 0 ? formatRupiah(tx.masuk) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-rose-700 font-medium">
                    {tx.keluar > 0 ? formatRupiah(tx.keluar) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-[#0F291E]">
                    {formatRupiah(tx.saldo)}
                  </td>
                  <td className="py-2 px-3 text-[#64748B] text-[11px]">{tx.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
