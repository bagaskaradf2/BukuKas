import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateRabProker } from '../services/api';
import { Edit3, Check, X } from 'lucide-react';

export default function RabProker() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
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
          <h1 className="text-base font-semibold text-[#0F291E]">RAB Program Kerja</h1>
          <p className="text-xs text-[#64748B]">Anggaran 9 blok program kerja terencana</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#64748B] block">Total Anggaran Proker</span>
          <span className="text-base font-bold tabular-nums text-[#0F291E]">
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
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              activeGroup === grp
                ? 'bg-[#0F291E] text-white'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8F9FA]'
            }`}
          >
            {grp === 'ALL' ? 'Semua Proker (9)' : grp}
          </button>
        ))}
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBlocks.map((block, bIdx) => (
          <div key={block.title} className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-3 bg-[#F8F9FA] border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0F291E] text-white mr-1.5">
                    {block.group}
                  </span>
                  <span className="font-semibold text-xs text-[#0F291E]">{block.title}</span>
                </div>
                <span className="font-semibold tabular-nums text-xs text-[#0F291E]">
                  {formatRupiah(block.total)}
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
                    {block.items.map((item, itIdx) => {
                      const isEditing = editingItem && editingItem.bIdx === bIdx && editingItem.itIdx === itIdx;

                      if (isEditing) {
                        return (
                          <tr key={itIdx} className="bg-amber-50/50">
                            <td className="py-1.5 px-2 text-center text-[#94A3B8]">{item.no || itIdx + 1}</td>
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
                        <tr key={itIdx} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="py-2 px-2 text-center text-[#94A3B8] font-mono">{item.no || itIdx + 1}</td>
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
                                onClick={() => handleStartEdit(bIdx, itIdx, item, block.colStart)}
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
              <span>Subtotal {block.title}</span>
              <span className="tabular-nums">{formatRupiah(block.total)}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
