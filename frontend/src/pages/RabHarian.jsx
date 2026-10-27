import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateRabHarian } from '../services/api';
import { Edit3, Check, X } from 'lucide-react';

export default function RabHarian() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const rabHarian = data?.rabHarian || [];

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
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
    <div className="space-y-4 pb-10">
      
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-[#0F291E]">RAB Kebutuhan Harian</h1>
          <p className="text-xs text-[#64748B]">Anggaran operasional (Konsumsi, Posko, Transportasi, Langganan, Sekre)</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#64748B] block">Total Anggaran Harian</span>
          <span className="text-base font-bold tabular-nums text-[#0F291E]">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
            activeCategory === 'ALL'
              ? 'bg-[#0F291E] text-white'
              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8F9FA]'
          }`}
        >
          Semua ({rabHarian.length})
        </button>
        {rabHarian.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              activeCategory === cat.category
                ? 'bg-[#0F291E] text-white'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8F9FA]'
            }`}
          >
            {cat.category.replace('RAB ', '')} ({formatRupiah(cat.total)})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCategories.map((cat, catIdx) => (
          <div key={cat.category} className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-3 bg-[#F8F9FA] border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="font-semibold text-xs text-[#0F291E]">{cat.category}</span>
                <span className="font-semibold tabular-nums text-xs text-[#0F291E]">
                  {formatRupiah(cat.total)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAFA] text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                      <th className="py-2 px-2 text-center w-8">No</th>
                      <th className="py-2 px-3">Kebutuhan</th>
                      <th className="py-2 px-2 text-center w-12">Vol</th>
                      <th className="py-2 px-2 w-14">Satuan</th>
                      <th className="py-2 px-2.5 text-right w-20">Harga</th>
                      <th className="py-2 px-3 text-right w-24">Jumlah</th>
                      {role === 'Bendahara' && <th className="py-2 px-2 text-center w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {cat.items.map((item, itemIdx) => {
                      const isEditing = editingItem && editingItem.catIdx === catIdx && editingItem.itemIdx === itemIdx;

                      if (isEditing) {
                        return (
                          <tr key={itemIdx} className="bg-amber-50/50">
                            <td className="py-1.5 px-2 text-center text-[#94A3B8]">{item.no || itemIdx + 1}</td>
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={editingItem.kebutuhan}
                                onChange={(e) => setEditingItem({ ...editingItem, kebutuhan: e.target.value })}
                                className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded text-xs"
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="number"
                                value={editingItem.volume}
                                onChange={(e) => setEditingItem({ ...editingItem, volume: e.target.value })}
                                className="w-full px-1 py-1 bg-white border border-amber-300 rounded text-xs text-center"
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={editingItem.satuan}
                                onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                                className="w-full px-1 py-1 bg-white border border-amber-300 rounded text-xs"
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="number"
                                value={editingItem.harga}
                                onChange={(e) => setEditingItem({ ...editingItem, harga: e.target.value })}
                                className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded text-xs text-right"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-right tabular-nums text-xs font-semibold">
                              {formatRupiah((Number(editingItem.volume) || 0) * (Number(editingItem.harga) || 0))}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={submitting}
                                  className="p-1 bg-[#0F291E] text-white rounded hover:bg-[#1B4D3E]"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={itemIdx} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="py-2 px-2 text-center text-[#94A3B8] font-mono">{item.no || itemIdx + 1}</td>
                          <td className="py-2 px-3 font-medium text-[#1E293B]">{item.kebutuhan}</td>
                          <td className="py-2 px-2 text-center tabular-nums text-[#64748B]">
                            {item.volume !== null ? item.volume : '-'}
                          </td>
                          <td className="py-2 px-2 text-[#64748B] text-[11px]">{item.satuan || '-'}</td>
                          <td className="py-2 px-2.5 text-right tabular-nums text-[#64748B]">
                            {item.harga ? formatRupiah(item.harga) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-[#1E293B]">
                            {formatRupiah(item.jumlah)}
                          </td>
                          {role === 'Bendahara' && (
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleStartEdit(catIdx, itemIdx, item, cat.colStart)}
                                className="p-1 text-[#94A3B8] hover:text-[#0F291E]"
                                title="Edit"
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

            <div className="p-2.5 bg-[#FAFAFA] border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0F291E]">
              <span>Subtotal {cat.category.replace('RAB ', '')}</span>
              <span className="tabular-nums">{formatRupiah(cat.total)}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
