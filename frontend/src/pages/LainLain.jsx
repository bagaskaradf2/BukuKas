import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { updateVest, updateFotoStudio } from '../services/api';
import { 
  Layers, 
  Shirt, 
  Camera, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function LainLain() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const lainLain = data?.lainLain || {};
  const vestItems = lainLain.vest || [];
  const fotoItems = lainLain.fotoStudio || [];

  const [editingVest, setEditingVest] = useState(null); // { idx, row, ukuran, keterangan }
  const [editingFoto, setEditingFoto] = useState(null); // { idx, row, onomoto, kuyStudio, keterangan }
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

      showToast('Data Vest berhasil diperbarui!', 'success');
      setEditingVest(null);
      refreshLogs();
    } catch (err) {
      showToast('Gagal update vest: ' + err.message, 'error');
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

      showToast('Data Foto Studio berhasil diperbarui!', 'success');
      setEditingFoto(null);
      refreshLogs();
    } catch (err) {
      showToast('Gagal update foto: ' + err.message, 'error');
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#123326] tracking-tight">LAIN LAIN (VEST & FOTO STUDIO)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5E9] text-[#1B4332] border border-[#74C69D]">
              Tab Sheet: LAIN LAIN
            </span>
          </div>
          <p className="text-xs text-[#6C757D] mt-1">
            Data Pembayaran Seragam Vest & Sesi Foto Studio Anggota KKN
          </p>
        </div>
      </div>

      {/* 2 Column Layout: Vest & Foto Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: VEST */}
        <div className="bg-white rounded-2xl border border-[#E2DDCF] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-[#FAF8F3] border-b border-[#E2DDCF] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shirt className="w-4 h-4 text-[#2D6A4F]" />
                <h3 className="font-bold text-sm text-[#123326]">DATA SERAGAM VEST</h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#6C757D] block">Total Biaya Vest</span>
                <span className="font-bold tabular-nums text-sm text-[#1B4332]">
                  {formatRupiah(lainLain.vestTotal || 1270000)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] text-[#4A5D53] border-b border-[#E2DDCF] text-[11px]">
                    <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                    <th className="py-2.5 px-3 font-semibold">Nama</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-16">Ukuran</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-24">Harga</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-24">Status</th>
                    {role === 'Bendahara' && <th className="py-2.5 px-2 font-semibold text-center w-10">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE4]">
                  {vestItems.map((item, idx) => {
                    const isEditing = editingVest && editingVest.idx === idx;
                    const isLunas = item.keterangan && item.keterangan.toLowerCase().includes('lunas');

                    if (isEditing) {
                      return (
                        <tr key={idx} className="bg-amber-50/60">
                          <td className="py-2 px-3 text-center text-[#8D99AE]">{item.no || idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-[#123326]">{item.nama}</td>
                          <td className="py-1 px-2">
                            <input
                              type="text"
                              value={editingVest.ukuran}
                              onChange={(e) => setEditingVest({ ...editingVest, ukuran: e.target.value })}
                              className="w-full px-1.5 py-1 bg-white border border-amber-400 rounded text-xs text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatRupiah(item.harga)}</td>
                          <td className="py-1 px-2">
                            <select
                              value={editingVest.keterangan}
                              onChange={(e) => setEditingVest({ ...editingVest, keterangan: e.target.value })}
                              className="w-full px-1 py-1 bg-white border border-amber-400 rounded text-[11px]"
                            >
                              <option value="Lunas">Lunas</option>
                              <option value="">Belum Lunas / Ditalangi</option>
                            </select>
                          </td>
                          <td className="py-1 px-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={handleSaveVest}
                                disabled={submitting}
                                className="p-1 bg-[#123326] text-white rounded hover:bg-[#1B4332]"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingVest(null)}
                                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={idx} className="hover:bg-[#FAF8F3] transition">
                        <td className="py-2.5 px-3 text-center text-[#8D99AE] font-mono">{item.no || idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#123326]">{item.nama}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#2D6A4F]">{item.ukuran || '-'}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#4A5D53]">{formatRupiah(item.harga)}</td>
                        <td className="py-2.5 px-3 text-center">
                          {isLunas ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="Ditalangi di Kas">
                              Ditalangi Kas
                            </span>
                          )}
                        </td>
                        {role === 'Bendahara' && (
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleStartEditVest(idx, item)}
                              className="p-1 text-[#6C757D] hover:text-[#123326]"
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

          <div className="p-3 bg-[#FAF8F3] border-t border-[#E2DDCF] flex items-center justify-between text-xs font-bold text-[#123326]">
            <span>TOTAL VEST (10 ANGGOTA)</span>
            <span className="tabular-nums text-[#1B4332] text-sm">
              {formatRupiah(lainLain.vestTotal || 1270000)}
            </span>
          </div>
        </div>

        {/* SECTION 2: FOTO STUDIO */}
        <div className="bg-white rounded-2xl border border-[#E2DDCF] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-[#FAF8F3] border-b border-[#E2DDCF] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-[#2D6A4F]" />
                <h3 className="font-bold text-sm text-[#123326]">FOTO STUDIO (ONOMOTO & KUY)</h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#6C757D] block">Total Biaya Foto</span>
                <span className="font-bold tabular-nums text-sm text-[#1B4332]">
                  {formatRupiah(lainLain.fotoTotal || 175000)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] text-[#4A5D53] border-b border-[#E2DDCF] text-[11px]">
                    <th className="py-2.5 px-2 font-semibold text-center w-8">No</th>
                    <th className="py-2.5 px-3 font-semibold">Nama</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Onomoto</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Kuy Studio</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Jumlah</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-16">Ket</th>
                    {role === 'Bendahara' && <th className="py-2.5 px-2 font-semibold text-center w-8">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE4]">
                  {fotoItems.map((item, idx) => {
                    const isEditing = editingFoto && editingFoto.idx === idx;

                    if (isEditing) {
                      return (
                        <tr key={idx} className="bg-amber-50/60">
                          <td className="py-2 px-2 text-center text-[#8D99AE]">{item.no || idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-[#123326]">{item.nama}</td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              value={editingFoto.onomoto}
                              onChange={(e) => setEditingFoto({ ...editingFoto, onomoto: e.target.value })}
                              className="w-full px-1.5 py-1 bg-white border border-amber-400 rounded text-xs text-right"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              value={editingFoto.kuyStudio}
                              onChange={(e) => setEditingFoto({ ...editingFoto, kuyStudio: e.target.value })}
                              className="w-full px-1.5 py-1 bg-white border border-amber-400 rounded text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold">
                            {formatRupiah((Number(editingFoto.onomoto) || 0) + (Number(editingFoto.kuyStudio) || 0))}
                          </td>
                          <td className="py-1 px-1 text-center">
                            <input
                              type="text"
                              value={editingFoto.keterangan}
                              onChange={(e) => setEditingFoto({ ...editingFoto, keterangan: e.target.value })}
                              className="w-full px-1 py-1 bg-white border border-amber-400 rounded text-[10px]"
                            />
                          </td>
                          <td className="py-1 px-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={handleSaveFoto}
                                disabled={submitting}
                                className="p-1 bg-[#123326] text-white rounded hover:bg-[#1B4332]"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingFoto(null)}
                                className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={idx} className="hover:bg-[#FAF8F3] transition">
                        <td className="py-2.5 px-2 text-center text-[#8D99AE] font-mono">{item.no || idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#123326]">{item.nama}</td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums text-[#4A5D53]">{formatRupiah(item.onomoto)}</td>
                        <td className="py-2.5 px-2.5 text-right tabular-nums text-[#4A5D53]">{formatRupiah(item.kuyStudio)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#123326]">{formatRupiah(item.jumlah)}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {item.keterangan || 'Lunas'}
                          </span>
                        </td>
                        {role === 'Bendahara' && (
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleStartEditFoto(idx, item)}
                              className="p-1 text-[#6C757D] hover:text-[#123326]"
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

          <div className="p-3 bg-[#FAF8F3] border-t border-[#E2DDCF] flex items-center justify-between text-xs font-bold text-[#123326]">
            <span>TOTAL FOTO STUDIO (10 ANGGOTA)</span>
            <span className="tabular-nums text-[#1B4332] text-sm">
              {formatRupiah(lainLain.fotoTotal || 175000)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
