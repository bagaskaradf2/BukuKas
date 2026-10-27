import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { saveKasTransaction } from '../services/api';
import { Plus, Search, Filter, X } from 'lucide-react';

export default function BbKas() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
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
    } catch (err) {
      showToast('Gagal mencatat transaksi: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Month Selector & Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {['OKTOBER', 'NOVEMBER', 'DESEMBER'].map(m => (
            <button
              key={m}
              onClick={() => setActiveMonth(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeMonth === m
                  ? 'bg-[#0F291E] text-white'
                  : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#0F291E] hover:bg-[#1B4D3E] text-white text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Transaksi Kas</span>
          </button>
        )}
      </div>

      {/* Quick Numbers Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <span className="text-[11px] text-[#64748B] block">Total Masuk ({activeMonth})</span>
          <span className="text-base font-bold tabular-nums text-emerald-700">
            {formatRupiah(totalMasuk)}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <span className="text-[11px] text-[#64748B] block">Total Keluar ({activeMonth})</span>
          <span className="text-base font-bold tabular-nums text-rose-700">
            {formatRupiah(totalKeluar)}
          </span>
        </div>
        <div className="bg-[#0F291E] text-white p-3.5 rounded-xl border border-[#1A382B] shadow-2xs">
          <span className="text-[11px] text-[#95D5B2] block">Saldo Akhir Berjalan ({activeMonth})</span>
          <span className="text-base font-bold tabular-nums text-white">
            {formatRupiah(latestSaldo)}
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white rounded-md border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#0F291E]"
          />
        </div>

        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-[#64748B]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-white rounded-md border border-[#E2E8F0] text-xs text-[#1E293B] focus:outline-none"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="MASUK">Pemasukan</option>
            <option value="KELUAR">Pengeluaran</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0F291E] text-white z-10 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                <th className="py-2.5 px-3 font-semibold w-20">Tanggal</th>
                <th className="py-2.5 px-3 font-semibold">Deskripsi</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Uang Masuk</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Uang Keluar</th>
                <th className="py-2.5 px-3 font-semibold text-right w-32 bg-[#091D15]">Saldo Berjalan</th>
                <th className="py-2.5 px-3 font-semibold w-28">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="py-2 px-3 text-center text-[#94A3B8] font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 text-[#64748B]">
                      {tx.tanggal ? `${activeMonth.slice(0, 3)} ${tx.tanggal}` : '-'}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#1E293B]">{tx.deskripsi}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-700 font-medium">
                      {tx.masuk > 0 ? formatRupiah(tx.masuk) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-rose-700 font-medium">
                      {tx.keluar > 0 ? formatRupiah(tx.keluar) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-[#0F291E] bg-[#FAFAFA]">
                      {formatRupiah(tx.saldo)}
                    </td>
                    <td className="py-2 px-3 text-[#64748B] text-[11px]">{tx.keterangan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#94A3B8]">
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-[#E2E8F0] shadow-xl overflow-hidden">
            <div className="bg-[#0F291E] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Catat Transaksi Buku Kas</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Bulan</label>
                <select
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md font-medium text-[#1E293B]"
                >
                  <option value="OKTOBER">OKTOBER</option>
                  <option value="NOVEMBER">NOVEMBER</option>
                  <option value="DESEMBER">DESEMBER</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Tanggal (Hari 1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md tabular-nums font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'Keluar' })}
                    className={`py-1.5 font-medium rounded-md border transition ${
                      formData.tipe === 'Keluar'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'Masuk' })}
                    className={`py-1.5 font-medium rounded-md border transition ${
                      formData.tipe === 'Masuk'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Lauk sayur, galon, dll"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md tabular-nums font-semibold"
                  required
                  min="500"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Keterangan / Kategori</label>
                <input
                  type="text"
                  placeholder="Konsumsi, Posko, dll"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E2E8F0] rounded-md text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-[#0F291E] hover:bg-[#1B4D3E] text-white rounded-md font-medium transition disabled:opacity-50"
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
