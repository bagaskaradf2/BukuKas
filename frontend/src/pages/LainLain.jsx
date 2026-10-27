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

  const [activeTab, setActiveTab] = useState('vest'); // 'vest' or 'foto'
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
      
      {/* Top Segmented Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('vest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'vest'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Seragam ({formatRupiah(lainLain.vestTotal || 1270000)})
          </button>
          <button
            onClick={() => setActiveTab('foto')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'foto'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Foto Studio ({formatRupiah(lainLain.fotoTotal || 175000)})
          </button>
        </div>
      </div>

      {/* SECTION 1: VEST */}
      {activeTab === 'vest' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3 text-center w-20">Ukuran</th>
                  <th className="py-2.5 px-3 text-right w-28">Harga</th>
                  <th className="py-2.5 px-3 text-center w-28">Status</th>
                  {role === 'Bendahara' && <th className="py-2.5 px-2 text-center w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {vestItems.map((item, idx) => {
                  const isEditing = editingVest && editingVest.idx === idx;
                  const isLunas = item.keterangan && item.keterangan.toLowerCase().includes('lunas');

                  if (isEditing) {
                    return (
                      <tr key={idx} className="bg-amber-50/50">
                        <td className="py-1.5 px-3 text-center text-zinc-400">{item.no || idx + 1}</td>
                        <td className="py-1.5 px-3 font-medium text-zinc-900">{item.nama}</td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={editingVest.ukuran}
                            onChange={(e) => setEditingVest({ ...editingVest, ukuran: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-center font-semibold"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{formatRupiah(item.harga)}</td>
                        <td className="py-1 px-2">
                          <select
                            value={editingVest.keterangan}
                            onChange={(e) => setEditingVest({ ...editingVest, keterangan: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs"
                          >
                            <option value="Lunas">Lunas</option>
                            <option value="">Belum Lunas</option>
                          </select>
                        </td>
                        <td className="py-1 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={handleSaveVest}
                              disabled={submitting}
                              className="p-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingVest(null)}
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
                    <tr key={idx} className="hover:bg-zinc-50/70">
                      <td className="py-2.5 px-3 text-center text-zinc-400 font-medium tabular-nums">{item.no || idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-zinc-900">{item.nama}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-zinc-800">{item.ukuran || '-'}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600">{formatRupiah(item.harga)}</td>
                      <td className="py-2.5 px-3 text-center">
                        {isLunas ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Lunas
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Ditalangi Kas
                          </span>
                        )}
                      </td>
                      {role === 'Bendahara' && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleStartEditVest(idx, item)}
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
      )}

      {/* SECTION 2: FOTO STUDIO */}
      {activeTab === 'foto' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3 text-right">Onomoto</th>
                  <th className="py-2.5 px-3 text-right">Kuy Studio</th>
                  <th className="py-2.5 px-3 text-right">Jumlah</th>
                  <th className="py-2.5 px-3 text-center w-20">Status</th>
                  {role === 'Bendahara' && <th className="py-2.5 px-2 text-center w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {fotoItems.map((item, idx) => {
                  const isEditing = editingFoto && editingFoto.idx === idx;

                  if (isEditing) {
                    return (
                      <tr key={idx} className="bg-amber-50/50">
                        <td className="py-1.5 px-3 text-center text-zinc-400">{item.no || idx + 1}</td>
                        <td className="py-1.5 px-3 font-medium text-zinc-900">{item.nama}</td>
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            value={editingFoto.onomoto}
                            onChange={(e) => setEditingFoto({ ...editingFoto, onomoto: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            value={editingFoto.kuyStudio}
                            onChange={(e) => setEditingFoto({ ...editingFoto, kuyStudio: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right tabular-nums font-semibold">
                          {formatRupiah((Number(editingFoto.onomoto) || 0) + (Number(editingFoto.kuyStudio) || 0))}
                        </td>
                        <td className="py-1 px-2 text-center">
                          <input
                            type="text"
                            value={editingFoto.keterangan}
                            onChange={(e) => setEditingFoto({ ...editingFoto, keterangan: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-center"
                          />
                        </td>
                        <td className="py-1 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={handleSaveFoto}
                              disabled={submitting}
                              className="p-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingFoto(null)}
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
                    <tr key={idx} className="hover:bg-zinc-50/70">
                      <td className="py-2.5 px-3 text-center text-zinc-400 font-medium tabular-nums">{item.no || idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-zinc-900">{item.nama}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600">{formatRupiah(item.onomoto)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600">{formatRupiah(item.kuyStudio)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-zinc-950">{formatRupiah(item.jumlah)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {item.keterangan || 'Lunas'}
                        </span>
                      </td>
                      {role === 'Bendahara' && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleStartEditFoto(idx, item)}
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
      )}

    </div>
  );
}
