import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateRabProker } from '../services/api';
import { Edit3, Check, X } from 'lucide-react';

export default function RabProker() {
  const { data, setData, role, showToast, refreshLogs, refreshData } = useApp();
  const rabProker = data?.rabProker || [];

  const [activeGroup, setActiveGroup] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const totalAllProker = rabProker.reduce((acc, b) => acc + (Number(b.total) || 0), 0);

  const filteredBlocks = activeGroup === 'ALL'
    ? rabProker
    : rabProker.filter(b => b.group === activeGroup);

  const handleStartEdit = (bIdx, itIdx, item, colStart) => {
    if (role !== 'Bendahara') return;
    setEditingItem({
      bIdx,
      itIdx,
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

      await updateRabProker({
        row: editingItem.row,
        colStart: editingItem.colStart,
        kebutuhan: editingItem.kebutuhan,
        volume: volNum,
        satuan: editingItem.satuan,
        harga: hrgNum
      }, role);

      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const block = next.rabProker[editingItem.bIdx];
        if (block && block.items[editingItem.itIdx]) {
          const it = block.items[editingItem.itIdx];
          it.kebutuhan = editingItem.kebutuhan;
          it.volume = volNum;
          it.satuan = editingItem.satuan;
          it.harga = hrgNum;
          it.jumlah = newJumlah;
          block.total = block.items.reduce((s, curr) => s + (Number(curr.jumlah) || 0), 0);
        }
        return next;
      });

      showToast(`Item '${editingItem.kebutuhan}' berhasil disimpan.`, 'success');
      setEditingItem(null);
      refreshLogs();
      refreshData(true);
    } catch (err) {
      showToast('Gagal memperbarui item: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">RAB Program Kerja</h1>
          <p className="text-xs text-zinc-500">Anggaran 9 blok program kerja terencana</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block uppercase">Total Anggaran Proker</span>
          <span className="text-sm font-bold tabular-nums text-zinc-950">
            {formatRupiah(totalAllProker)}
          </span>
        </div>
      </div>

      {/* Filter by Group */}
      <div className="flex space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {['ALL', 'PROKER UTAMA', 'PROKER PENUNJANG', 'PROKER TAMBAHAN'].map(grp => (
          <button
            key={grp}
            onClick={() => setActiveGroup(grp)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeGroup === grp
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {grp === 'ALL' ? 'Semua Proker (9)' : grp}
          </button>
        ))}
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBlocks.map((block, bIdx) => (
          <div key={block.title} className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 mr-1.5">
                    {block.group}
                  </span>
                  <span className="font-semibold text-xs text-zinc-900">{block.title}</span>
                </div>
                <span className="font-semibold tabular-nums text-xs text-zinc-950">
                  {formatRupiah(block.total)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white text-zinc-500 border-b border-zinc-100 text-[11px] font-medium">
                      <th className="py-2 px-2 text-center w-8">No</th>
                      <th className="py-2 px-3">Kebutuhan</th>
                      <th className="py-2 px-2 text-center w-12">Vol</th>
                      <th className="py-2 px-2 w-14">Satuan</th>
                      <th className="py-2 px-2.5 text-right w-20">Harga</th>
                      <th className="py-2 px-3 text-right w-24">Jumlah</th>
                      {role === 'Bendahara' && <th className="py-2 px-2 text-center w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {block.items.map((item, itIdx) => {
                      const isEditing = editingItem && editingItem.bIdx === bIdx && editingItem.itIdx === itIdx;

                      if (isEditing) {
                        return (
                          <tr key={itIdx} className="bg-amber-50/50">
                            <td className="py-1.5 px-2 text-center text-zinc-400">{item.no || itIdx + 1}</td>
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
                                  className="p-1 bg-zinc-900 text-white rounded hover:bg-zinc-800 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="p-1 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={itIdx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-2 px-2 text-center text-zinc-400 font-mono">{item.no || itIdx + 1}</td>
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
                                onClick={() => handleStartEdit(bIdx, itIdx, item, block.colStart)}
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

            <div className="px-3.5 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs font-semibold text-zinc-900">
              <span>Subtotal {block.title}</span>
              <span className="tabular-nums">{formatRupiah(block.total)}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
