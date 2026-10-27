import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateVest, updateFotoStudio } from '../services/api';
import { Edit3, Check, X } from 'lucide-react';

export default function LainLain() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const lainLain = data?.lainLain || {};
  const vestItems = lainLain.vest || [];
  const fotoItems = lainLain.fotoStudio || [];

  const [editingVest, setEditingVest] = useState(null);
  const [editingFoto, setEditingFoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Vest handlers
  const handleStartEditVest = (idx, item) => {
    if (role !== 'Bendahara') return;
    setEditingVest({
      idx,
      row: item.row,
      ukuran: item.ukuran,
      keterangan: item.keterangan
    });
  };

  const handleSaveVest = async () => {
    if (!editingVest) return;
    setSubmitting(true);
    try {
      await updateVest({
        row: editingVest.row,
        ukuran: editingVest.ukuran,
        keterangan: editingVest.keterangan
      }, role);

      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const it = next.lainLain.vest[editingVest.idx];
        if (it) {
          it.ukuran = editingVest.ukuran;
          it.keterangan = editingVest.keterangan;
        }
        return next;
      });

      showToast('Data seragam berhasil diperbarui.', 'success');
      setEditingVest(null);
      refreshLogs();
    } catch (err) {
      showToast('Gagal update seragam: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Foto handlers
  const handleStartEditFoto = (idx, item) => {
    if (role !== 'Bendahara') return;
    setEditingFoto({
      idx,
      row: item.row,
      onomoto: item.onomoto,
      kuyStudio: item.kuyStudio,
      keterangan: item.keterangan
    });
  };

  const handleSaveFoto = async () => {
    if (!editingFoto) return;
    setSubmitting(true);
    try {
      const ono = Number(editingFoto.onomoto) || 0;
      const kuy = Number(editingFoto.kuyStudio) || 0;

      await updateFotoStudio({
        row: editingFoto.row,
        onomoto: ono,
        kuyStudio: kuy,
        keterangan: editingFoto.keterangan
      }, role);

      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const it = next.lainLain.fotoStudio[editingFoto.idx];
        if (it) {
          it.onomoto = ono;
          it.kuyStudio = kuy;
          it.jumlah = ono + kuy;
          it.keterangan = editingFoto.keterangan;
          next.lainLain.fotoTotal = next.lainLain.fotoStudio.reduce((s, curr) => s + (curr.jumlah || 0), 0);
        }
        return next;
      });

      showToast('Data foto studio berhasil diperbarui.', 'success');
      setEditingFoto(null);
      refreshLogs();
    } catch (err) {
      showToast('Gagal update foto: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-[#0F291E]">Lain-Lain (Seragam & Foto Studio)</h1>
          <p className="text-xs text-[#64748B]">Status iuran non-operasional per anggota</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* SECTION 1: VEST */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3 bg-[#F8F9FA] border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="font-semibold text-xs text-[#0F291E]">Seragam Vest</span>
              <span className="font-semibold tabular-nums text-xs text-[#0F291E]">
                {formatRupiah(lainLain.vestTotal || 1270000)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                    <th className="py-2 px-3 text-center w-8">No</th>
                    <th className="py-2 px-3">Nama</th>
                    <th className="py-2 px-3 text-center w-16">Ukuran</th>
                    <th className="py-2 px-3 text-right w-24">Harga</th>
                    <th className="py-2 px-3 text-center w-24">Status</th>
                    {role === 'Bendahara' && <th className="py-2 px-2 text-center w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {vestItems.map((item, idx) => {
                    const isEditing = editingVest && editingVest.idx === idx;
                    const isLunas = item.keterangan && item.keterangan.toLowerCase().includes('lunas');

                    if (isEditing) {
                      return (
                        <tr key={idx} className="bg-amber-50/50">
                          <td className="py-1.5 px-3 text-center text-[#94A3B8]">{item.no || idx + 1}</td>
                          <td className="py-1.5 px-3 font-medium text-[#1E293B]">{item.nama}</td>
                          <td className="py-1 px-2">
                            <input
                              type="text"
                              value={editingVest.ukuran}
                              onChange={(e) => setEditingVest({ ...editingVest, ukuran: e.target.value })}
                              className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded text-xs text-center font-semibold"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right tabular-nums">{formatRupiah(item.harga)}</td>
                          <td className="py-1 px-2">
                            <select
                              value={editingVest.keterangan}
                              onChange={(e) => setEditingVest({ ...editingVest, keterangan: e.target.value })}
                              className="w-full px-1 py-1 bg-white border border-amber-300 rounded text-[11px]"
                            >
                              <option value="Lunas">Lunas</option>
                              <option value="">Belum Lunas</option>
                            </select>
                          </td>
                          <td className="py-1 px-2 text-center">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={handleSaveVest}
                                disabled={submitting}
                                className="p-1 bg-[#0F291E] text-white rounded hover:bg-[#1B4D3E]"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingVest(null)}
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
                      <tr key={idx} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-2 px-3 text-center text-[#94A3B8] font-mono">{item.no || idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-[#1E293B]">{item.nama}</td>
                        <td className="py-2 px-3 text-center font-semibold text-[#0F291E]">{item.ukuran || '-'}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#64748B]">{formatRupiah(item.harga)}</td>
                        <td className="py-2 px-3 text-center">
                          {isLunas ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Ditalangi Kas
                            </span>
                          )}
                        </td>
                        {role === 'Bendahara' && (
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleStartEditVest(idx, item)}
                              className="p-1 text-[#94A3B8] hover:text-[#0F291E]"
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
            <span>Total Seragam</span>
            <span className="tabular-nums">{formatRupiah(lainLain.vestTotal || 1270000)}</span>
          </div>
        </div>

        {/* SECTION 2: FOTO STUDIO */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3 bg-[#F8F9FA] border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="font-semibold text-xs text-[#0F291E]">Foto Studio</span>
              <span className="font-semibold tabular-nums text-xs text-[#0F291E]">
                {formatRupiah(lainLain.fotoTotal || 175000)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                    <th className="py-2 px-2 text-center w-8">No</th>
                    <th className="py-2 px-3">Nama</th>
                    <th className="py-2 px-2 text-right">Onomoto</th>
                    <th className="py-2 px-2 text-right">Kuy Studio</th>
                    <th className="py-2 px-3 text-right">Jumlah</th>
                    <th className="py-2 px-2 text-center w-16">Status</th>
                    {role === 'Bendahara' && <th className="py-2 px-2 text-center w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {fotoItems.map((item, idx) => {
                    const isEditing = editingFoto && editingFoto.idx === idx;

                    if (isEditing) {
                      return (
                        <tr key={idx} className="bg-amber-50/50">
                          <td className="py-1.5 px-2 text-center text-[#94A3B8]">{item.no || idx + 1}</td>
                          <td className="py-1.5 px-3 font-medium text-[#1E293B]">{item.nama}</td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              value={editingFoto.onomoto}
                              onChange={(e) => setEditingFoto({ ...editingFoto, onomoto: e.target.value })}
                              className="w-full px-1 py-1 bg-white border border-amber-300 rounded text-xs text-right"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              value={editingFoto.kuyStudio}
                              onChange={(e) => setEditingFoto({ ...editingFoto, kuyStudio: e.target.value })}
                              className="w-full px-1 py-1 bg-white border border-amber-300 rounded text-xs text-right"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right tabular-nums font-semibold">
                            {formatRupiah((Number(editingFoto.onomoto) || 0) + (Number(editingFoto.kuyStudio) || 0))}
                          </td>
                          <td className="py-1 px-1 text-center">
                            <input
                              type="text"
                              value={editingFoto.keterangan}
                              onChange={(e) => setEditingFoto({ ...editingFoto, keterangan: e.target.value })}
                              className="w-full px-1 py-1 bg-white border border-amber-300 rounded text-[10px]"
                            />
                          </td>
                          <td className="py-1 px-2 text-center">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={handleSaveFoto}
                                disabled={submitting}
                                className="p-1 bg-[#0F291E] text-white rounded hover:bg-[#1B4D3E]"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingFoto(null)}
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
                      <tr key={idx} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-2 px-2 text-center text-[#94A3B8] font-mono">{item.no || idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-[#1E293B]">{item.nama}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-[#64748B]">{formatRupiah(item.onomoto)}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-[#64748B]">{formatRupiah(item.kuyStudio)}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-[#0F291E]">{formatRupiah(item.jumlah)}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.keterangan || 'Lunas'}
                          </span>
                        </td>
                        {role === 'Bendahara' && (
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleStartEditFoto(idx, item)}
                              className="p-1 text-[#94A3B8] hover:text-[#0F291E]"
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
            <span>Total Foto Studio</span>
            <span className="tabular-nums">{formatRupiah(lainLain.fotoTotal || 175000)}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
