import React from 'react';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/MetricCard';
import { formatRupiah, formatDate } from '../utils/formatters';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  PieChart, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { data, setActiveTab } = useApp();

  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const pendapatanLain = kartuIuran.pendapatanLain || {};
  const totalDanaKelompok = kartuIuran.totalDanaKelompok || 17300000;
  const uangProker = kartuIuran.uangProker || 7000000;

  // Kas calculations from BB KAS
  const bbKasOktober = data?.bbKas?.OKTOBER || [];
  const latestTx = bbKasOktober.length > 0 ? bbKasOktober[bbKasOktober.length - 1] : null;
  const saldoSaatIni = latestTx ? latestTx.saldo : 16145000;

  // Total Keluar di Buku Kas
  const totalPengeluaranKas = bbKasOktober.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);

  // Total RAB Harian
  const rabHarian = data?.rabHarian || [];
  const totalRabHarian = rabHarian.reduce((acc, cat) => acc + (Number(cat.total) || 0), 0);

  // Member completion count (target Rp 1.600.000)
  const TARGET_PER_MEMBER = 1600000;
  const completedMembers = members.filter(m => (Number(m.total) || 0) >= TARGET_PER_MEMBER).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-[#123326] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-[#0D281E]">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B4332] text-[#A7D7C5] text-xs font-semibold mb-3 border border-[#2D6A4F]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AGENDA IURAN & KEUANGAN KKN M UNY 2026/2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Laporan Real-Time Kas & Anggaran KKN
          </h1>
          <p className="text-xs sm:text-sm text-[#A7D7C5] leading-relaxed">
            "Ya Allah lancarkan dan mudahkan rencana kami, usaha kami, rezeki kami supaya KKN-nya besok lancar, sugih, sehat, sukses, aamiin! 💗"
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#2D6A4F]/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Kas Saat Ini"
          amount={formatRupiah(saldoSaatIni)}
          subtitle="Tercatat di Buku Kas Oktober"
          icon={Wallet}
          variant="forest"
          badge="Live"
        />
        <MetricCard
          title="Total Dana Kelompok"
          amount={formatRupiah(totalDanaKelompok)}
          subtitle={`Iuran Anggota + Pendapatan Lain`}
          icon={ArrowUpRight}
          variant="default"
        />
        <MetricCard
          title="Total Pengeluaran Kas"
          amount={formatRupiah(totalPengeluaranKas)}
          subtitle={`${bbKasOktober.length} transaksi di BB KAS`}
          icon={ArrowDownRight}
          variant="default"
        />
        <MetricCard
          title="Anggaran Terencana (RAB)"
          amount={formatRupiah(totalRabHarian + uangProker)}
          subtitle={`RAB Harian + Alokasi Proker`}
          icon={PieChart}
          variant="default"
        />
      </div>

      {/* 2 Column Layout: Status Iuran Anggota & Ringkasan Alokasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Iuran Anggota (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E2DDCF] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#123326]">Progress Iuran Anggota</h2>
              <p className="text-xs text-[#6C757D]">Target baku per anggota: {formatRupiah(TARGET_PER_MEMBER)}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B4332] border border-[#74C69D]">
              {completedMembers} dari {members.length} Lunas
            </span>
          </div>

          <div className="space-y-3">
            {members.map((m, idx) => {
              const current = Number(m.total) || 0;
              const percentage = Math.min(100, Math.round((current / TARGET_PER_MEMBER) * 100));
              const isOver = current > TARGET_PER_MEMBER;
              return (
                <div key={idx} className="p-3 rounded-xl bg-[#FAF8F3] border border-[#EAE5D9] hover:bg-[#F4F1EA] transition">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-1.5">
                    <span className="text-[#123326] flex items-center">
                      <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-[11px] font-bold inline-flex items-center justify-center mr-2">
                        {idx + 1}
                      </span>
                      {m.name}
                    </span>
                    <div className="text-right">
                      <span className="tabular-nums font-bold text-[#1B4332]">{formatRupiah(current)}</span>
                      {isOver && (
                        <span className="text-[10px] text-emerald-600 font-semibold ml-2">
                          (+{formatRupiah(current - TARGET_PER_MEMBER)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2DDCF] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage >= 100 ? 'bg-[#2D6A4F]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[#EAE5D9] flex items-center justify-between text-xs">
            <span className="text-[#6C757D]">Pendapatan Lain-lain Terkumpul:</span>
            <span className="font-bold tabular-nums text-[#123326]">{formatRupiah(pendapatanLain.total || 900000)}</span>
          </div>
        </div>

        {/* Ringkasan Rencana Anggaran (1 col) */}
        <div className="space-y-6">
          
          {/* RAB Harian Box */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2DDCF] shadow-xs">
            <h2 className="text-base font-bold text-[#123326] mb-4">RAB Kebutuhan Harian</h2>
            <div className="space-y-2.5 text-xs">
              {rabHarian.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#F0EDE4] last:border-0">
                  <span className="text-[#4A5D53] font-medium">{cat.category.replace('RAB ', '')}</span>
                  <span className="tabular-nums font-bold text-[#123326]">{formatRupiah(cat.total)}</span>
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between font-bold text-[#123326] text-sm">
                <span>Total RAB Harian</span>
                <span className="tabular-nums text-[#2D6A4F]">{formatRupiah(totalRabHarian)}</span>
              </div>
            </div>
          </div>

          {/* Uang Proker Card */}
          <div className="bg-[#FAF8F3] rounded-2xl p-6 border border-[#D5CFC1] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#52796F]">Alokasi Proker</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B4332] text-white">Master</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-[#123326]">
              {formatRupiah(uangProker)}
            </div>
            <p className="text-xs text-[#6C757D] mt-1">
              Khusus dialokasikan untuk 9 blok Program Kerja KKN di Padukuhan Pengkol.
            </p>
            <button
              onClick={() => setActiveTab('RAB PROKER')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-[#123326] hover:bg-[#1B4332] text-white text-xs font-semibold transition"
            >
              Lihat Detail RAB Proker &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* Transaksi Terakhir di Buku Kas */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2DDCF] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#123326]">Aktivitas Terakhir di Buku Kas (Oktober)</h2>
            <p className="text-xs text-[#6C757D]">Menampilkan 6 transaksi terkini dari tab BB KAS</p>
          </div>
          <button
            onClick={() => setActiveTab('BB KAS')}
            className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] underline"
          >
            Buka Seluruh Buku Kas &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DDCF] bg-[#FAF8F3] text-[#4A5D53]">
                <th className="py-2.5 px-3 font-semibold">Tgl</th>
                <th className="py-2.5 px-3 font-semibold">Deskripsi</th>
                <th className="py-2.5 px-3 font-semibold text-right">Masuk</th>
                <th className="py-2.5 px-3 font-semibold text-right">Keluar</th>
                <th className="py-2.5 px-3 font-semibold text-right">Saldo Berjalan</th>
                <th className="py-2.5 px-3 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE4]">
              {bbKasOktober.slice(-6).reverse().map((tx, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8F3] transition">
                  <td className="py-2.5 px-3 font-medium text-[#123326]">
                    {tx.tanggal ? `Okt ${tx.tanggal}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#123326]">{tx.deskripsi}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                    {tx.masuk > 0 ? formatRupiah(tx.masuk) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-700 font-semibold">
                    {tx.keluar > 0 ? formatRupiah(tx.keluar) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#123326]">
                    {formatRupiah(tx.saldo)}
                  </td>
                  <td className="py-2.5 px-3 text-[#6C757D]">{tx.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
