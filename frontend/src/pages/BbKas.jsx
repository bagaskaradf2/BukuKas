import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { saveKasTransaction } from '../services/api';
import { Plus, Search, Filter, X } from 'lucide-react';

export default function BbKas() {
  const { data, setData, role, showToast, refreshLogs, refreshData } = useApp();
  const bbKas = data?.bbKas || {};

  const [activeMonth, setActiveMonth] = useState('OKTOBER');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bulan: 'OKTOBER',
    tanggal: new Date().getDate(),
    deskripsi: '',
    tipe: 'Keluar',
    nominal: '',
    keterangan: 'Konsumsi'
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenAdd = () => {
    setFormData({
      bulan: activeMonth,
      tanggal: new Date().getDate(),
      deskripsi: '',
      tipe: 'Keluar',
      nominal: '',
      keterangan: 'Konsumsi'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nominal || Number(formData.nominal) <= 0) {
      showToast('Nominal harus berupa angka positif.', 'error');
      return;
    }
    if (!formData.deskripsi.trim()) {
      showToast('Deskripsi transaksi wajib diisi.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const numNominal = Number(formData.nominal);
      await saveKasTransaction({
        bulan: formData.bulan,
        tanggal: Number(formData.tanggal),
        deskripsi: formData.deskripsi.trim(),
        tipe: formData.tipe,
        nominal: numNominal,
        keterangan: formData.keterangan.trim()
      }, role);

      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const list = next.bbKas[formData.bulan] || [];
        const lastBalance = list.length > 0 ? list[list.length - 1].saldo : 17300000;
        const nextBalance = formData.tipe === 'Masuk' ? lastBalance + numNominal : lastBalance - numNominal;

        list.push({
          row: list.length + 8,
          bulanLabel: '',
          tanggal: Number(formData.tanggal),
          deskripsi: formData.deskripsi.trim(),
          masuk: formData.tipe === 'Masuk' ? numNominal : 0,
          keluar: formData.tipe === 'Keluar' ? numNominal : 0,
          saldo: nextBalance,
          keterangan: formData.keterangan.trim()
        });
        next.bbKas[formData.bulan] = list;
        return next;
      });

      showToast(`Transaksi kas berhasil dicatat.`, 'success');
      setIsModalOpen(false);
      refreshLogs();
      refreshData(true);
    } catch (err) {
      showToast('Gagal mencatat transaksi: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Month Selector & Controls */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5">
          {['OKTOBER', 'NOVEMBER', 'DESEMBER'].map(m => (
            <button
              key={m}
              onClick={() => setActiveMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeMonth === m
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Catat Transaksi Kas</span>
          </button>
        )}
      </div>

      {/* Quick Numbers Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-zinc-200">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">
            Total Masuk ({activeMonth})
          </span>
          <span className="text-xl font-bold tabular-nums text-emerald-700 mt-1 block">
            {formatRupiah(totalMasuk)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">
            Total Keluar ({activeMonth})
          </span>
          <span className="text-xl font-bold tabular-nums text-zinc-950 mt-1 block">
            {formatRupiah(totalKeluar)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">
            Saldo Akhir ({activeMonth})
          </span>
          <span className="text-xl font-bold tabular-nums text-zinc-950 mt-1 block">
            {formatRupiah(latestSaldo)}
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi kas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-white rounded-lg border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="MASUK">Pemasukan</option>
            <option value="KELUAR">Pengeluaran</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-600 border-b border-zinc-200 z-10 text-[11px] font-medium">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-3 w-24">Tanggal</th>
                <th className="py-2.5 px-3">Deskripsi</th>
                <th className="py-2.5 px-3 text-right w-28">Uang Masuk</th>
                <th className="py-2.5 px-3 text-right w-28">Uang Keluar</th>
                <th className="py-2.5 px-3 text-right w-32 font-semibold text-zinc-950">Saldo Kas</th>
                <th className="py-2.5 px-3 w-28">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-zinc-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">
                      {tx.tanggal ? `${activeMonth.slice(0, 3)} ${tx.tanggal}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-zinc-900">{tx.deskripsi}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700 font-medium whitespace-nowrap">
                      {tx.masuk > 0 ? formatRupiah(tx.masuk) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-zinc-900 font-medium whitespace-nowrap">
                      {tx.keluar > 0 ? formatRupiah(tx.keluar) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-zinc-950 whitespace-nowrap">
                      {formatRupiah(tx.saldo)}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{tx.keterangan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-zinc-400">
                    Tidak ada transaksi untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-zinc-200 shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">Catat Transaksi Buku Kas</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-zinc-600 mb-1">Bulan</label>
                <select
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-zinc-900 bg-white"
                >
                  <option value="OKTOBER">OKTOBER</option>
                  <option value="NOVEMBER">NOVEMBER</option>
                  <option value="DESEMBER">DESEMBER</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Tanggal (Hari 1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded tabular-nums font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'Keluar' })}
                    className={`py-1.5 font-medium rounded border transition cursor-pointer ${
                      formData.tipe === 'Keluar'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'Masuk' })}
                    className={`py-1.5 font-medium rounded border transition cursor-pointer ${
                      formData.tipe === 'Masuk'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Lauk sayur, galon, dll"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded tabular-nums font-semibold"
                  required
                  min="500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Keterangan / Kategori</label>
                <input
                  type="text"
                  placeholder="Konsumsi, Posko, dll"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
