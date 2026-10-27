import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { saveKasTransaction } from '../services/api';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Lock, 
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function BbKas() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const bbKas = data?.bbKas || {};

  const [activeMonth, setActiveMonth] = useState('OKTOBER');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'MASUK', 'KELUAR'
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

  // Calculations for current month
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
      showToast('Nominal transaksi harus berupa angka positif!', 'error');
      return;
    }
    if (!formData.deskripsi.trim()) {
      showToast('Deskripsi transaksi wajib diisi!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const numNominal = Number(formData.nominal);
      const res = await saveKasTransaction({
        bulan: formData.bulan,
        tanggal: Number(formData.tanggal),
        deskripsi: formData.deskripsi.trim(),
        tipe: formData.tipe,
        nominal: numNominal,
        keterangan: formData.keterangan.trim()
      }, role);

      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Transaksi '${formData.deskripsi}' Rp ${numNominal.toLocaleString('id-ID')} berhasil dicatat!`, 'success');
        
        // Update local state directly
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

        setIsModalOpen(false);
        refreshLogs();
      }
    } catch (err) {
      showToast('Gagal mencatat kas: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title & Actions Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2DDCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123326] tracking-tight">BUKU BESAR KAS KKN (BB KAS)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5E9] text-[#1B4332] border border-[#74C69D]">
              Tab Sheet: BB KAS
            </span>
          </div>
          <p className="text-xs text-[#6C757D] mt-1">
            Arus Kas Masuk & Keluar Harian beserta Saldo Berjalan (Oktober, November, Desember 2026)
          </p>
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-[#123326] hover:bg-[#1B4332] text-white text-xs font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Transaksi Kas Baru</span>
          </button>
        )}
      </div>

      {/* Month Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {['OKTOBER', 'NOVEMBER', 'DESEMBER'].map(m => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeMonth === m
                ? 'bg-[#123326] text-white shadow-xs'
                : 'bg-white text-[#4A5D53] border border-[#E2DDCF] hover:bg-[#F4F1EA]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bulan {m}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-[#A7D7C5]">
              {(bbKas[m] || []).length} Tx
            </span>
          </button>
        ))}
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2DDCF] shadow-xs">
          <span className="text-xs text-[#6C757D] block mb-1">Total Pemasukan ({activeMonth})</span>
          <div className="text-lg font-bold tabular-nums text-emerald-700 flex items-center">
            <ArrowUpRight className="w-4 h-4 mr-1 text-emerald-600" />
            {formatRupiah(totalMasuk)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DDCF] shadow-xs">
          <span className="text-xs text-[#6C757D] block mb-1">Total Pengeluaran ({activeMonth})</span>
          <div className="text-lg font-bold tabular-nums text-rose-700 flex items-center">
            <ArrowDownRight className="w-4 h-4 mr-1 text-rose-600" />
            {formatRupiah(totalKeluar)}
          </div>
        </div>

        <div className="bg-[#123326] text-white p-4 rounded-xl border border-[#0D281E] shadow-xs">
          <span className="text-xs text-[#95D5B2] block mb-1">Saldo Akhir Berjalan ({activeMonth})</span>
          <div className="text-xl font-bold tabular-nums text-white flex items-center">
            <Wallet className="w-4 h-4 mr-1 text-[#74C69D]" />
            {formatRupiah(latestSaldo)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8D99AE] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari deskripsi transaksi kas (Lauk, Gas, Banner, dll)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-[#E2DDCF] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#6C757D]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-[#E2DDCF] text-xs sm:text-sm font-medium text-[#123326] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          >
            <option value="ALL">Semua Tipe Transaksi</option>
            <option value="MASUK">Pemasukan (Debit)</option>
            <option value="KELUAR">Pengeluaran (Kredit)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E2DDCF] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#FAF8F3] border-b border-[#E2DDCF] flex items-center justify-between text-xs">
          <span className="font-bold text-[#123326] flex items-center">
            <BookOpen className="w-4 h-4 mr-1.5 text-[#2D6A4F]" />
            Buku Kas {activeMonth} (Maks 71 baris template)
          </span>
          <span className="text-[11px] text-[#6C757D] flex items-center">
            <Lock className="w-3 h-3 mr-1 text-[#2D6A4F]" />
            Formula Saldo: <code className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono ml-1">=SaldoSblm + Masuk - Keluar</code>
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#123326] text-white z-10 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-center w-12 border-r border-[#1B4332]">No</th>
                <th className="py-2.5 px-3 font-semibold w-20 border-r border-[#1B4332]">Tanggal</th>
                <th className="py-2.5 px-4 font-semibold border-r border-[#1B4332]">Deskripsi Transaksi</th>
                <th className="py-2.5 px-3 font-semibold text-right w-32 border-r border-[#1B4332]">Uang Masuk</th>
                <th className="py-2.5 px-3 font-semibold text-right w-32 border-r border-[#1B4332]">Uang Keluar</th>
                <th className="py-2.5 px-3 font-semibold text-right w-36 border-r border-[#1B4332] bg-[#0D281E]">
                  Saldo Berjalan
                </th>
                <th className="py-2.5 px-3 font-semibold w-32">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE4]">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F3] transition">
                    <td className="py-2 px-3 text-center text-[#8D99AE] font-mono border-r border-[#F0EDE4]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#123326] border-r border-[#F0EDE4]">
                      {tx.tanggal ? `${activeMonth.slice(0, 3)} ${tx.tanggal}` : '-'}
                    </td>
                    <td className="py-2 px-4 font-medium text-[#123326] border-r border-[#F0EDE4]">
                      {tx.deskripsi}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-800 font-semibold border-r border-[#F0EDE4]">
                      {tx.masuk > 0 ? formatRupiah(tx.masuk) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-rose-800 font-semibold border-r border-[#F0EDE4]">
                      {tx.keluar > 0 ? formatRupiah(tx.keluar) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-[#123326] bg-slate-50/50 border-r border-[#F0EDE4]">
                      {formatRupiah(tx.saldo)}
                    </td>
                    <td className="py-2 px-3 text-[#52796F] text-[11px]">
                      {tx.keterangan ? (
                        <span className="px-2 py-0.5 rounded bg-[#FAF8F3] border border-[#E2DDCF] font-medium">
                          {tx.keterangan}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[#8D99AE]">
                    Tidak ada transaksi untuk filter yang dipilih pada bulan {activeMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INPUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#D5CFC1] shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-[#123326] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base text-[#E8F5E9]">
                Catat Transaksi Buku Kas Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Bulan Buku Kas</label>
                <select
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold text-[#123326]"
                >
                  <option value="OKTOBER">OKTOBER</option>
                  <option value="NOVEMBER">NOVEMBER</option>
                  <option value="DESEMBER">DESEMBER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Tanggal (Hari 1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'Keluar' })}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      formData.tipe === 'Keluar'
                        ? 'bg-rose-50 text-rose-800 border-rose-400'
                        : 'border-[#E2DDCF] text-[#6C757D]'
                    }`}
                  >
                    Pengeluaran (Keluar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'Masuk' })}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      formData.tipe === 'Masuk'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                        : 'border-[#E2DDCF] text-[#6C757D]'
                    }`}
                  >
                    Pemasukan (Masuk)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Deskripsi Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Lauk Sayur Cabe, Bayar Gas, Sabun Cuci"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="Contoh: 45000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold tabular-nums"
                  required
                  min="500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Keterangan / Kategori (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Konsumsi, Lain-Lain, Posko"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold text-[#6C757D] hover:bg-[#FAF8F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#123326] hover:bg-[#1B4332] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
