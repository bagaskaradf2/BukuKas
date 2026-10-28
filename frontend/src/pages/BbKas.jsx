import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateBbKasTransaction } from '../services/api';
import { Search, Pencil, Check, X, Loader2 } from 'lucide-react';

export default function BbKas() {
  const { data, loading, role, showToast, updateBbKasRowLocal } = useApp();
  const bbKas = data?.bbKas || {};

  const [activeMonth, setActiveMonth] = useState('OKTOBER');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  // Edit State
  const [editingRow, setEditingRow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleStartEdit = (tx) => {
    setEditingRow({
      row: tx.row,
      tanggal: tx.tanggal ?? '',
      deskripsi: tx.deskripsi ?? '',
      masuk: tx.masuk ?? 0,
      keluar: tx.keluar ?? 0,
      keterangan: tx.keterangan ?? ''
    });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;

    const deskripsiTrimmed = String(editingRow.deskripsi || '').trim();
    if (!deskripsiTrimmed) {
      showToast('Deskripsi transaksi wajib diisi', 'error');
      return;
    }

    const payload = {
      bulan: activeMonth,
      row: Number(editingRow.row),
      tanggal: editingRow.tanggal !== '' && editingRow.tanggal !== null ? Number(editingRow.tanggal) : null,
      deskripsi: deskripsiTrimmed,
      masuk: Number(editingRow.masuk) || 0,
      keluar: Number(editingRow.keluar) || 0,
      keterangan: String(editingRow.keterangan || '').trim()
    };

    setIsSaving(true);
    try {
      // 1. Optimistic update langsung di state lokal agar UI instan merespon
      if (updateBbKasRowLocal) {
        updateBbKasRowLocal(activeMonth, payload);
      }

      // 2. Kirim update ke Google Spreadsheet
      const res = await updateBbKasTransaction(payload, role);
      if (res && res.error) {
        showToast(`Tersimpan lokal: ${res.error}`, 'warning');
      } else {
        showToast('Transaksi Buku Kas berhasil diperbarui di spreadsheet', 'success');
      }
      setEditingRow(null);
    } catch (err) {
      console.warn('Gagal sinkron edit ke spreadsheet:', err);
      showToast('Perubahan tersimpan lokal, koneksi spreadsheet bermasalah', 'warning');
      setEditingRow(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Month Selector & Title */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
              Buku Kas (Buku Bantu Kas)
            </h1>
            {role === 'Bendahara' && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Mode Edit Aktif
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Jurnal pembukuan arus kas masuk dan keluar secara kronologis
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-zinc-100 p-1 rounded-xl">
          {['OKTOBER', 'NOVEMBER', 'DESEMBER'].map(m => (
            <button
              key={m}
              onClick={() => {
                setActiveMonth(m);
                setEditingRow(null);
              }}
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
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500 border-b border-zinc-200/80 z-10 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3 w-24">Tanggal</th>
                <th className="py-3 px-3 min-w-[200px]">Deskripsi Transaksi</th>
                <th className="py-3 px-3 text-right w-32 text-emerald-800">Uang Masuk</th>
                <th className="py-3 px-3 text-right w-32 text-rose-800">Uang Keluar</th>
                <th className="py-3 px-4 text-right w-36 font-bold text-zinc-950 bg-zinc-100/60">Saldo Kas</th>
                <th className="py-3 px-3 w-36">Alokasi / Pos</th>
                {role === 'Bendahara' && (
                  <th className="py-3 px-3 text-center w-20">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx, idx) => {
                  const isEditing = editingRow && editingRow.row === tx.row;

                  if (isEditing) {
                    return (
                      <tr key={tx.row || idx} className="bg-emerald-50/40 border-y border-emerald-200/70">
                        <td className="py-3 px-3 text-center text-zinc-400 font-medium tabular-nums">
                          {idx + 1}
                        </td>

                        {/* Tanggal Input */}
                        <td className="py-2 px-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-[11px] text-zinc-400 font-semibold">{activeMonth.slice(0, 3)}</span>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={editingRow.tanggal}
                              onChange={(e) => setEditingRow(prev => ({ ...prev, tanggal: e.target.value }))}
                              className="w-12 px-1.5 py-1 text-xs border border-emerald-300 rounded-lg bg-white font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                              placeholder="Tgl"
                            />
                          </div>
                        </td>

                        {/* Deskripsi Input */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editingRow.deskripsi}
                            onChange={(e) => setEditingRow(prev => ({ ...prev, deskripsi: e.target.value }))}
                            className="w-full px-2.5 py-1 text-xs border border-emerald-300 rounded-lg bg-white font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Deskripsi mutasi..."
                            autoFocus
                          />
                        </td>

                        {/* Masuk Input */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={editingRow.masuk}
                            onChange={(e) => setEditingRow(prev => ({ ...prev, masuk: e.target.value }))}
                            className="w-28 px-2 py-1 text-xs text-right border border-emerald-300 rounded-lg bg-white tabular-nums font-semibold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        </td>

                        {/* Keluar Input */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={editingRow.keluar}
                            onChange={(e) => setEditingRow(prev => ({ ...prev, keluar: e.target.value }))}
                            className="w-28 px-2 py-1 text-xs text-right border border-emerald-300 rounded-lg bg-white tabular-nums font-semibold text-rose-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        </td>

                        {/* Saldo Preview (Dihitung Realtime) */}
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-zinc-950 whitespace-nowrap bg-emerald-100/30">
                          {formatRupiah(
                            idx === 0
                              ? Number(editingRow.masuk) || 0
                              : (filteredTxs[idx - 1]?.saldo || 0) + (Number(editingRow.masuk) || 0) - (Number(editingRow.keluar) || 0)
                          )}
                        </td>

                        {/* Keterangan / Alokasi Input */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editingRow.keterangan}
                            onChange={(e) => setEditingRow(prev => ({ ...prev, keterangan: e.target.value }))}
                            className="w-full px-2.5 py-1 text-xs border border-emerald-300 rounded-lg bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Alokasi pos..."
                          />
                        </td>

                        {/* Aksi Simpan / Batal */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              disabled={isSaving}
                              onClick={handleSaveEdit}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs disabled:opacity-50"
                              title="Simpan Perubahan"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={tx.row || idx} 
                      onDoubleClick={() => role === 'Bendahara' && handleStartEdit(tx)}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
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
                      
                      {role === 'Bendahara' && (
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleStartEdit(tx)}
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer border border-transparent hover:border-emerald-200 text-[11px] font-medium"
                            title="Edit Transaksi Ini (atau klik ganda)"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={role === 'Bendahara' ? 8 : 7} className="text-center py-10 text-xs text-zinc-400">
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
