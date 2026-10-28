import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { Search } from 'lucide-react';

export default function BbKas() {
  const { data, loading } = useApp();
  const bbKas = data?.bbKas || {};

  const [activeMonth, setActiveMonth] = useState('OKTOBER');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  const currentMonthTxs = bbKas[activeMonth] || [];

  const filteredTxs = currentMonthTxs.filter(tx => {
    const matchesSearch = tx.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
                          (tx.keterangan && tx.keterangan.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterType === 'MASUK') return tx.masuk > 0;
    if (filterType === 'KELUAR') return tx.keluar > 0;
    return true;
  });

  const totalMasuk = currentMonthTxs.reduce((s, t) => s + (Number(t.masuk) || 0), 0);
  const totalKeluar = currentMonthTxs.reduce((s, t) => s + (Number(t.keluar) || 0), 0);
  const latestSaldo = currentMonthTxs.length > 0 ? currentMonthTxs[currentMonthTxs.length - 1].saldo : 0;

  return (
    <div className="space-y-4 pb-10">
      
      {/* Month Selector & Title */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
            Buku Kas (Buku Bantu Kas)
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Jurnal pembukuan arus kas masuk dan keluar secara kronologis
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-zinc-100 p-1 rounded-xl">
          {['OKTOBER', 'NOVEMBER', 'DESEMBER'].map(m => (
            <button
              key={m}
              onClick={() => setActiveMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeMonth === m
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Numbers Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/90 shadow-xs bg-gradient-to-br from-white to-emerald-50/20">
          <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">
            Total Uang Masuk ({activeMonth})
          </span>
          <span className="text-2xl font-bold tabular-nums text-emerald-700 mt-1.5 block">
            {formatRupiah(totalMasuk)}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs bg-gradient-to-br from-white to-rose-50/20">
          <span className="text-[11px] text-rose-800 font-bold uppercase tracking-wider block">
            Total Uang Keluar ({activeMonth})
          </span>
          <span className="text-2xl font-bold tabular-nums text-rose-600 mt-1.5 block">
            {formatRupiah(totalKeluar)}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs">
          <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">
            Saldo Akhir Kas ({activeMonth})
          </span>
          <span className="text-2xl font-bold tabular-nums text-zinc-950 mt-1.5 block">
            {formatRupiah(latestSaldo)}
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi atau pos pengeluaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-800 font-medium focus:outline-none focus:border-zinc-400 transition"
          >
            <option value="ALL">Semua Mutasi</option>
            <option value="MASUK">Pemasukan</option>
            <option value="KELUAR">Pengeluaran</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500 border-b border-zinc-200/80 z-10 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3 w-24">Tanggal</th>
                <th className="py-3 px-3">Deskripsi Transaksi</th>
                <th className="py-3 px-3 text-right w-32 text-emerald-800">Uang Masuk</th>
                <th className="py-3 px-3 text-right w-32 text-rose-800">Uang Keluar</th>
                <th className="py-3 px-4 text-right w-36 font-bold text-zinc-950 bg-zinc-100/60">Saldo Kas</th>
                <th className="py-3 px-3 w-32">Alokasi / Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-zinc-400 font-medium tabular-nums">{idx + 1}</td>
                    <td className="py-3 px-3 text-zinc-500 whitespace-nowrap font-medium">
                      {tx.tanggal ? `${activeMonth.slice(0, 3)} ${tx.tanggal}` : '-'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-900">{tx.deskripsi}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-emerald-700 font-semibold whitespace-nowrap">
                      {tx.masuk > 0 ? formatRupiah(tx.masuk) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-rose-600 font-semibold whitespace-nowrap">
                      {tx.keluar > 0 ? formatRupiah(tx.keluar) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-zinc-950 whitespace-nowrap bg-zinc-50/50">
                      {formatRupiah(tx.saldo)}
                    </td>
                    <td className="py-3 px-3 text-zinc-600 text-[11px] font-medium">{tx.keterangan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-zinc-400">
                    {loading ? 'Memuat data Buku Kas dari Google Spreadsheet...' : 'Belum ada transaksi mutasi kas tercatat di Google Spreadsheet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
