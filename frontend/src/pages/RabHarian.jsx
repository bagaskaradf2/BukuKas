import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { updateRabHarian } from '../services/api';
import { 
  CalendarClock, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  Layers, 
  DollarSign, 
  Sparkles,
  Info
} from 'lucide-react';

export default function RabHarian() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const rabHarian = data?.rabHarian || [];

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null); // { catIndex, itemIndex, row, colStart, kebutuhan, volume, satuan, harga }
  const [submitting, setSubmitting] = useState(false);

  const grandTotal = rabHarian.reduce((acc, cat) => acc + (Number(cat.total) || 0), 0);

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

      // Update local state
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

          // Recalculate category total
          cat.total = cat.items.reduce((s, curr) => s + (Number(curr.jumlah) || 0), 0);
        }
        return next;
      });

      showToast(`Item '${editingItem.kebutuhan}' berhasil diperbarui!`, 'success');
      setEditingItem(null);
      refreshLogs();
    } catch (err) {
      showToast('Gagal memperbarui item RAB: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title & Overview */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2DDCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123326] tracking-tight">RAB HARIAN</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5E9] text-[#1B4332] border border-[#74C69D]">
              Tab Sheet: RAB HARIAN
            </span>
          </div>
          <p className="text-xs text-[#6C757D] mt-1">
            Rencana Anggaran dan Biaya Kebutuhan Harian KKN (Konsumsi, Posko, Transportasi, Langganan, Sekre)
          </p>
        </div>

        <div className="bg-[#FAF8F3] px-4 py-3 rounded-xl border border-[#E2DDCF] text-right">
          <span className="text-xs text-[#6C757D] block">Grand Total RAB Harian</span>
          <span className="text-xl font-bold tabular-nums text-[#123326]">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeCategory === 'ALL'
              ? 'bg-[#123326] text-white shadow-xs'
              : 'bg-white text-[#4A5D53] border border-[#E2DDCF] hover:bg-[#F4F1EA]'
          }`}
        >
          Semua Kategori (5)
        </button>
        {rabHarian.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeCategory === cat.category
                ? 'bg-[#123326] text-white shadow-xs'
                : 'bg-white text-[#4A5D53] border border-[#E2DDCF] hover:bg-[#F4F1EA]'
            }`}
          >
            {cat.category.replace('RAB ', '')} ({formatRupiah(cat.total)})
          </button>
        ))}
      </div>

      {/* Category Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((cat, catIdx) => (
          <div key={cat.category} className="bg-white rounded-2xl border border-[#E2DDCF] shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="p-4 bg-[#FAF8F3] border-b border-[#E2DDCF] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#123326] tracking-tight">{cat.category}</h3>
                  <span className="text-[11px] text-[#6C757D]">Maks 14 baris item per section</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#6C757D] block">Subtotal</span>
                  <span className="font-bold tabular-nums text-sm text-[#1B4332]">
                    {formatRupiah(cat.total)}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F3] text-[#4A5D53] border-b border-[#E2DDCF] text-[11px]">
                      <th className="py-2 px-2.5 font-semibold text-center w-8">No</th>
                      <th className="py-2 px-3 font-semibold">Kebutuhan</th>
                      <th className="py-2 px-2.5 font-semibold text-center w-14">Vol</th>
                      <th className="py-2 px-2.5 font-semibold w-16">Satuan</th>
                      <th className="py-2 px-3 font-semibold text-right w-24">Harga</th>
                      <th className="py-2 px-3 font-semibold text-right w-28">Jumlah</th>
                      {role === 'Bendahara' && <th className="py-2 px-2 font-semibold text-center w-10">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EDE4]">
                    {cat.items.map((item, itemIdx) => {
                      const isEditing = editingItem && editingItem.catIdx === catIdx && editingItem.itemIdx === itemIdx;

                      if (isEditing) {
                        return (
                          <tr key={itemIdx} className="bg-amber-50/60">
                            <td className="py-2 px-2 text-center text-[#8D99AE]">{item.no || itemIdx + 1}</td>
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={editingItem.kebutuhan}
                                onChange={(e) => setEditingItem({ ...editingItem, kebutuhan: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-amber-400 rounded text-xs"
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="number"
                                value={editingItem.volume}
                                onChange={(e) => setEditingItem({ ...editingItem, volume: e.target.value })}
                                className="w-full px-1.5 py-1 bg-white border border-amber-400 rounded text-xs text-center"
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={editingItem.satuan}
                                onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                                className="w-full px-1.5 py-1 bg-white border border-amber-400 rounded text-xs"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                value={editingItem.harga}
                                onChange={(e) => setEditingItem({ ...editingItem, harga: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-amber-400 rounded text-xs text-right"
                              />
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-xs font-semibold text-[#123326]">
                              {formatRupiah((Number(editingItem.volume) || 0) * (Number(editingItem.harga) || 0))}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={submitting}
                                  className="p-1 bg-[#123326] text-white rounded hover:bg-[#1B4332]"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
                        <tr key={itemIdx} className="hover:bg-[#FAF8F3] transition">
                          <td className="py-2.5 px-2 text-center text-[#8D99AE] font-mono">{item.no || itemIdx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-[#123326]">{item.kebutuhan}</td>
                          <td className="py-2.5 px-2.5 text-center tabular-nums text-[#4A5D53]">
                            {item.volume !== null ? item.volume : '-'}
                          </td>
                          <td className="py-2.5 px-2.5 text-[#6C757D]">{item.satuan || '-'}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-[#4A5D53]">
                            {item.harga ? formatRupiah(item.harga) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[#123326]">
                            {formatRupiah(item.jumlah)}
                          </td>
                          {role === 'Bendahara' && (
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => handleStartEdit(catIdx, itemIdx, item, cat.colStart)}
                                className="p-1 text-[#6C757D] hover:text-[#123326] rounded transition"
                                title="Edit Baris Item Ini"
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

            {/* Total Footer */}
            <div className="p-3 bg-[#FAF8F3] border-t border-[#E2DDCF] flex items-center justify-between text-xs font-bold text-[#123326]">
              <span className="flex items-center">
                <Lock className="w-3 h-3 text-[#2D6A4F] mr-1" />
                JUMLAH {cat.category}
              </span>
              <span className="tabular-nums text-[#1B4332] text-sm">
                {formatRupiah(cat.total)}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
