import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateRabHarian } from '../services/api';
import { Edit3, Check, X } from 'lucide-react';

export default function RabHarian() {
  const { data, setData, role, showToast, refreshLogs, loading } = useApp();
  const rabHarian = data?.rabHarian || [];

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Hitung subtotal tiap kategori secara aman & akurat
  const getCatSubtotal = (cat) => {
    const sum = (cat.items || []).reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);
    return sum > 0 ? sum : (Number(cat.total) || 0);
  };

  // Grand total anggaran dari seluruh kategori
  const grandTotal = rabHarian.reduce((acc, cat) => acc + getCatSubtotal(cat), 0);

  const filteredCategories = activeCategory === 'ALL'
    ? rabHarian
    : rabHarian.filter(c => c.category === activeCategory);

  const handleStartEdit = (catIdx, itemIdx, item, colStart) => {
    if (role !== 'Bendahara') return;
    setEditingItem({
      catIdx,
      itemIdx,
      row: item.row,
      colStart: colStart,
      kebutuhan: item.kebutuhan,
      volume: item.volume ?? '',
      satuan: item.satuan ?? '',
      harga: item.harga ?? ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSubmitting(true);

    try {
      const volNum = editingItem.volume === '' ? null : Number(editingItem.volume);
      const hrgNum = editingItem.harga === '' ? null : Number(editingItem.harga);
      const newJumlah = (volNum && hrgNum) ? volNum * hrgNum : 0;

      await updateRabHarian({
        row: editingItem.row,
        colStart: editingItem.colStart,
        kebutuhan: editingItem.kebutuhan,
        volume: volNum,
        satuan: editingItem.satuan,
        harga: hrgNum
      }, role);

      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const cat = next.rabHarian[editingItem.catIdx];
        if (cat && cat.items[editingItem.itemIdx]) {
          const it = cat.items[editingItem.itemIdx];
          it.kebutuhan = editingItem.kebutuhan;
          it.volume = volNum;
          it.satuan = editingItem.satuan;
          it.harga = hrgNum;
          it.jumlah = newJumlah;
          cat.total = cat.items.reduce((s, curr) => s + (Number(curr.jumlah) || 0), 0);
        }
        return next;
      });

      showToast(`Item '${editingItem.kebutuhan}' berhasil diperbarui.`, 'success');
      setEditingItem(null);
      refreshLogs();
    } catch (err) {
      showToast('Gagal memperbarui item: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      
      {/* Top Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-950 uppercase tracking-wide">
            RAB Kebutuhan Harian
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Anggaran operasional: konsumsi, posko, transportasi, langganan & sekre
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
            Total Anggaran Harian
          </span>
          <span className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </div>

      {/* Category Pills (Emerald Palette) */}
      <div className="flex space-x-2 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeCategory === 'ALL'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Semua ({rabHarian.length})
        </button>
        {rabHarian.map(cat => {
          const catSub = getCatSubtotal(cat);
          return (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat.category
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {cat.category.replace('RAB ', '')} ({formatRupiah(catSub)})
            </button>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredCategories.map((cat, catIdx) => {
          const subtotalCat = getCatSubtotal(cat);

          return (
            <div key={cat.category} className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header Kategori dengan Subtotal yang Sangat Jelas */}
                <div className="px-4 py-3 bg-zinc-50/70 border-b border-zinc-200/90 flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-950 uppercase tracking-wide">
                    {cat.category}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold tabular-nums text-xs shadow-2xs">
                    Subtotal: {formatRupiah(subtotalCat)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white text-zinc-500 border-b border-zinc-100 text-[11px] font-semibold">
                        <th className="py-2.5 px-3 text-center w-8">No</th>
                        <th className="py-2.5 px-3">Kebutuhan</th>
                        <th className="py-2.5 px-2 text-center w-12">Vol</th>
                        <th className="py-2.5 px-2 w-14">Satuan</th>
                        <th className="py-2.5 px-3 text-right w-24">Harga</th>
                        <th className="py-2.5 px-4 text-right w-28">Jumlah</th>
                        {role === 'Bendahara' && <th className="py-2.5 px-2 text-center w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {cat.items.map((item, itemIdx) => {
                        const isEditing = editingItem && editingItem.catIdx === catIdx && editingItem.itemIdx === itemIdx;

                        if (isEditing) {
                          return (
                            <tr key={itemIdx} className="bg-emerald-50/40">
                              <td className="py-1.5 px-2 text-center text-zinc-400">{item.no || itemIdx + 1}</td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  value={editingItem.kebutuhan}
                                  onChange={(e) => setEditingItem({ ...editingItem, kebutuhan: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs focus:outline-none"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  value={editingItem.volume}
                                  onChange={(e) => setEditingItem({ ...editingItem, volume: e.target.value })}
                                  className="w-full px-1 py-1 bg-white border border-emerald-300 rounded text-xs text-center font-medium focus:outline-none"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={editingItem.satuan}
                                  onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                                  className="w-full px-1 py-1 bg-white border border-emerald-300 rounded text-xs focus:outline-none"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  value={editingItem.harga}
                                  onChange={(e) => setEditingItem({ ...editingItem, harga: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs text-right font-medium tabular-nums focus:outline-none"
                                />
                              </td>
                              <td className="py-1.5 px-4 text-right tabular-nums text-xs font-bold text-zinc-950">
                                {formatRupiah((Number(editingItem.volume) || 0) * (Number(editingItem.harga) || 0))}
                              </td>
                              <td className="py-1 px-2 text-center">
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={submitting}
                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="p-1 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={itemIdx} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-center text-zinc-400 font-medium tabular-nums">{item.no || itemIdx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{item.kebutuhan}</td>
                            <td className="py-2.5 px-2 text-center tabular-nums text-zinc-600 font-medium">
                              {item.volume !== null ? item.volume : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-zinc-500 text-[11px]">{item.satuan || '-'}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600 font-medium">
                              {item.harga ? formatRupiah(item.harga) : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums font-bold text-zinc-950">
                              {formatRupiah(item.jumlah)}
                            </td>
                            {role === 'Bendahara' && (
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => handleStartEdit(catIdx, itemIdx, item, cat.colStart)}
                                  className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Subtotal Tabel */}
              <div className="px-4 py-2.5 bg-zinc-50/70 border-t border-zinc-200/90 flex items-center justify-between text-xs font-semibold text-zinc-950">
                <span className="text-zinc-500 font-medium">
                  Subtotal {cat.category.replace('RAB ', '')} ({cat.items.length} kebutuhan)
                </span>
                <span className="font-bold tabular-nums text-emerald-700 text-sm">
                  {formatRupiah(subtotalCat)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-12 text-center text-xs text-zinc-400">
          {loading ? 'Memuat data RAB Kebutuhan Harian dari Google Spreadsheet...' : 'Belum ada data RAB Kebutuhan Harian dari Google Spreadsheet.'}
        </div>
      )}

    </div>
  );
}
