import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateRabHarian, addRabHarianItem } from '../services/api';
import { Edit3, Check, X, Plus } from 'lucide-react';

export default function RabHarian() {
  const { data, setData, role, showToast, refreshLogs, refreshData } = useApp();
  const rabHarian = data?.rabHarian || [];

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('RAB KONSUMSI');
  const [newKebutuhan, setNewKebutuhan] = useState('');
  const [newVolume, setNewVolume] = useState('1');
  const [newSatuan, setNewSatuan] = useState('Kali');
  const [newHarga, setNewHarga] = useState('');

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

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newKebutuhan.trim()) {
      showToast('Nama kebutuhan wajib diisi.', 'error');
      return;
    }
    const volNum = Number(newVolume) || 1;
    const hrgNum = Number(newHarga) || 0;
    const jmlNum = volNum * hrgNum;

    setSubmitting(true);
    try {
      // 1. Optimistic update
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const cat = next.rabHarian.find(c => c.category === newCategory);
        if (cat) {
          cat.items.push({
            row: cat.items.length + 6,
            no: cat.items.length + 1,
            kebutuhan: newKebutuhan.trim(),
            volume: volNum,
            satuan: newSatuan.trim(),
            harga: hrgNum,
            jumlah: jmlNum
          });
          cat.total += jmlNum;
        }
        return next;
      });

      // 2. Kirim ke API / Apps Script
      await addRabHarianItem({
        category: newCategory,
        kebutuhan: newKebutuhan.trim(),
        volume: volNum,
        satuan: newSatuan.trim(),
        harga: hrgNum
      }, role);

      showToast(`Item '${newKebutuhan}' berhasil ditambahkan ke ${newCategory}.`, 'success');
      setIsAddModalOpen(false);
      setNewKebutuhan('');
      setNewVolume('1');
      setNewHarga('');
      refreshLogs();
      refreshData(true);
    } catch (err) {
      showToast('Gagal menambah item: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">RAB Kebutuhan Harian</h1>
          <p className="text-xs text-zinc-500">Anggaran konsumsi, posko, transportasi, langganan, dan sekre</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block uppercase">Total Anggaran</span>
            <span className="text-sm font-bold tabular-nums text-zinc-950">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          {role === 'Bendahara' && (
            <button
              onClick={() => {
                if (activeCategory !== 'ALL') setNewCategory(activeCategory);
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${
            activeCategory === 'ALL'
              ? 'bg-zinc-900 text-white'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Semua ({rabHarian.length})
        </button>
        {rabHarian.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${
              activeCategory === cat.category
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {cat.category.replace('RAB ', '')} ({formatRupiah(cat.total)})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCategories.map((cat, catIdx) => (
          <div key={cat.category} className="bg-white rounded-lg border border-zinc-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-900">{cat.category}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold tabular-nums text-xs text-zinc-950">
                    {formatRupiah(cat.total)}
                  </span>
                  {role === 'Bendahara' && (
                    <button
                      onClick={() => {
                        setNewCategory(cat.category);
                        setIsAddModalOpen(true);
                      }}
                      title="Tambah baris item"
                      className="text-zinc-500 hover:text-zinc-900 p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white text-zinc-500 border-b border-zinc-100 text-[11px]">
                      <th className="py-2 px-2.5 text-center w-8">No</th>
                      <th className="py-2 px-3">Kebutuhan</th>
                      <th className="py-2 px-2 text-center w-12">Vol</th>
                      <th className="py-2 px-2 w-14">Satuan</th>
                      <th className="py-2 px-2.5 text-right w-20">Harga</th>
                      <th className="py-2 px-3 text-right w-24">Jumlah</th>
                      {role === 'Bendahara' && <th className="py-2 px-2 text-center w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {cat.items.map((item, itemIdx) => {
                      const isEditing = editingItem && editingItem.catIdx === catIdx && editingItem.itemIdx === itemIdx;

                      if (isEditing) {
                        return (
                          <tr key={itemIdx} className="bg-amber-50/50">
                            <td className="py-1.5 px-2 text-center text-zinc-400">{item.no || itemIdx + 1}</td>
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
                                  className="p-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
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
                        <tr key={itemIdx} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-2 text-center text-zinc-400 font-mono">{item.no || itemIdx + 1}</td>
                          <td className="py-2 px-3 font-medium text-zinc-900">{item.kebutuhan}</td>
                          <td className="py-2 px-2 text-center tabular-nums text-zinc-600">
                            {item.volume !== null ? item.volume : '-'}
                          </td>
                          <td className="py-2 px-2 text-zinc-600 text-[11px]">{item.satuan || '-'}</td>
                          <td className="py-2 px-2.5 text-right tabular-nums text-zinc-600">
                            {item.harga ? formatRupiah(item.harga) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-zinc-900">
                            {formatRupiah(item.jumlah)}
                          </td>
                          {role === 'Bendahara' && (
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleStartEdit(catIdx, itemIdx, item, cat.colStart)}
                                className="p-1 text-zinc-400 hover:text-zinc-900"
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

            <div className="px-3.5 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs font-semibold text-zinc-900">
              <span>Subtotal {cat.category.replace('RAB ', '')}</span>
              <span className="tabular-nums">{formatRupiah(cat.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Item Kebutuhan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full border border-zinc-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">
                Tambah Item Kebutuhan RAB
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Kategori RAB</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded bg-white text-zinc-900 font-medium"
                >
                  <option value="RAB KONSUMSI">RAB Konsumsi</option>
                  <option value="RAB POSKO/KEBERSIHAN">RAB Posko & Kebersihan</option>
                  <option value="RAB TRANSPORTASI">RAB Transportasi</option>
                  <option value="RAB LANGGANAN">RAB Langganan</option>
                  <option value="RAB SEKRE">RAB Sekretariat</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Nama Kebutuhan</label>
                <input
                  type="text"
                  placeholder="Contoh: Minyak Goreng, Isi Staples"
                  value={newKebutuhan}
                  onChange={(e) => setNewKebutuhan(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-zinc-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Volume</label>
                  <input
                    type="number"
                    min="1"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Kg / Hari / Liter / Kali"
                    value={newSatuan}
                    onChange={(e) => setNewSatuan(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Harga Satuan (Rupiah)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={newHarga}
                  onChange={(e) => setNewHarga(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded tabular-nums font-semibold"
                  required
                />
              </div>

              <div className="p-2 bg-zinc-50 rounded border border-zinc-200 flex justify-between text-xs">
                <span className="text-zinc-500">Estimasi Jumlah:</span>
                <span className="font-bold tabular-nums text-zinc-950">
                  {formatRupiah((Number(newVolume) || 1) * (Number(newHarga) || 0))}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
