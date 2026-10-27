import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatDate, formatNumber } from '../utils/formatters';
import { saveIuran, saveLainLainIuran } from '../services/api';
import { Plus, Search, ChevronRight, ChevronDown, X } from 'lucide-react';

const MONTHS = ['FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER/OKTOBER'];

export default function KartuIuran() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const pendapatanLain = kartuIuran.pendapatanLain || {};

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [expandedMember, setExpandedMember] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('member');
  const [formData, setFormData] = useState({
    member: 'SARAH',
    month: 'SEPTEMBER/OKTOBER',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    metode: 'Transfer',
    keterangan: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = (memberName = 'SARAH') => {
    setModalType('member');
    setFormData({
      member: memberName,
      month: 'SEPTEMBER/OKTOBER',
      tanggal: new Date().toISOString().split('T')[0],
      nominal: '',
      metode: 'Transfer',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAddLain = () => {
    setModalType('lain');
    setFormData({
      member: '',
      month: 'SEPTEMBER/OKTOBER',
      tanggal: new Date().toISOString().split('T')[0],
      nominal: '',
      metode: '',
      keterangan: 'Bank Jago'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nominal || Number(formData.nominal) <= 0) {
      showToast('Nominal harus berupa angka positif.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'member') {
        const res = await saveIuran({
          member: formData.member,
          month: formData.month,
          tanggal: formData.tanggal,
          nominal: Number(formData.nominal),
          metode: formData.metode
        }, role);

        if (res.error) {
          showToast(res.error, 'error');
        } else {
          showToast(`Iuran ${formData.member} sebesar ${formatRupiah(formData.nominal)} tersimpan.`, 'success');
          setData(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const mem = next.kartuIuran.members.find(m => m.name === formData.member);
            if (mem && mem.months[formData.month]) {
              mem.months[formData.month].entries.push({
                slot: mem.months[formData.month].entries.length + 1,
                tanggal: formData.tanggal,
                nominal: Number(formData.nominal),
                metode: formData.metode
              });
              mem.months[formData.month].subtotal += Number(formData.nominal);
              mem.total += Number(formData.nominal);
              next.kartuIuran.totalDanaKelompok += Number(formData.nominal);
              next.kartuIuran.totalBersih += Number(formData.nominal);
            }
            return next;
          });
          setIsModalOpen(false);
          refreshLogs();
        }
      } else {
        await saveLainLainIuran({
          month: formData.month,
          tanggal: formData.tanggal,
          nominal: Number(formData.nominal),
          keterangan: formData.keterangan
        }, role);

        showToast(`Pendapatan lain sebesar ${formatRupiah(formData.nominal)} tersimpan.`, 'success');
        setData(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          const pLain = next.kartuIuran.pendapatanLain;
          if (pLain && pLain.months[formData.month]) {
            pLain.months[formData.month].entries.push({
              slot: pLain.months[formData.month].entries.length + 1,
              tanggal: formData.tanggal,
              nominal: Number(formData.nominal),
              keterangan: formData.keterangan
            });
            pLain.months[formData.month].subtotal += Number(formData.nominal);
            pLain.total += Number(formData.nominal);
            next.kartuIuran.totalDanaKelompok += Number(formData.nominal);
            next.kartuIuran.totalBersih += Number(formData.nominal);
          }
          return next;
        });
        setIsModalOpen(false);
        refreshLogs();
      }
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded border border-zinc-200 text-xs focus:outline-none focus:border-zinc-400"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 bg-white rounded border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
          >
            <option value="ALL">Semua Bulan</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {role === 'Bendahara' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAdd()}
              className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition inline-flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Catat Iuran</span>
            </button>
            <button
              onClick={handleOpenAddLain}
              className="px-3 py-1.5 rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition inline-flex items-center space-x-1"
            >
              <Plus className="w-3 h-3 text-zinc-500" />
              <span>Pendapatan Lain</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-3 w-36">Nama</th>
                {MONTHS.map(m => {
                  if (selectedMonth !== 'ALL' && selectedMonth !== m) return null;
                  return (
                    <th key={m} className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      {m.slice(0, 3)}
                    </th>
                  );
                })}
                <th className="py-2.5 px-3 text-right w-32 bg-zinc-100/60 font-semibold text-zinc-900">
                  Total
                </th>
                <th className="py-2.5 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredMembers.map((m, idx) => {
                const isExpanded = expandedMember === m.name;

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedMember(isExpanded ? null : m.name)}
                      className={`hover:bg-zinc-50/70 cursor-pointer transition-colors ${isExpanded ? 'bg-zinc-50' : ''}`}
                    >
                      <td className="py-2 px-3 text-center text-zinc-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-zinc-900">{m.name}</td>
                      {MONTHS.map(monthKey => {
                        if (selectedMonth !== 'ALL' && selectedMonth !== monthKey) return null;
                        const sub = m.months[monthKey]?.subtotal || 0;
                        return (
                          <td key={monthKey} className="py-2 px-2.5 text-right tabular-nums text-zinc-700">
                            {sub > 0 ? formatNumber(sub) : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right tabular-nums font-semibold bg-zinc-50 text-zinc-950">
                        {formatRupiah(m.total)}
                      </td>
                      <td className="py-2 px-2 text-center text-zinc-400">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                    </tr>

                    {/* Inline Expandable Drawer */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={selectedMonth === 'ALL' ? 11 : 4} className="p-3 border-y border-zinc-200">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
                              <span>Mutasi Setoran: {m.name}</span>
                              {role === 'Bendahara' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAdd(m.name);
                                  }}
                                  className="text-zinc-600 hover:text-zinc-950 text-xs font-normal"
                                >
                                  + Tambah ke {m.name}
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {MONTHS.map(mKey => {
                                const mData = m.months[mKey] || { entries: [], subtotal: 0 };
                                if (mData.entries.length === 0) return null;

                                return (
                                  <div key={mKey} className="bg-white p-2 rounded border border-zinc-200 text-xs">
                                    <div className="flex justify-between font-medium text-zinc-700 text-[11px] pb-1 border-b border-zinc-100">
                                      <span>{mKey}</span>
                                      <span className="tabular-nums font-semibold">{formatRupiah(mData.subtotal)}</span>
                                    </div>
                                    <div className="space-y-0.5 pt-1">
                                      {mData.entries.map((e, eIdx) => (
                                        <div key={eIdx} className="text-[10px] flex justify-between text-zinc-500">
                                          <span>{formatDate(e.tanggal)} ({e.metode || 'Cash'})</span>
                                          <span className="tabular-nums font-medium text-zinc-800">{formatRupiah(e.nominal)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pendapatan Lain-Lain */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 mb-3">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-zinc-900">Pendapatan Lain-Lain</h3>
            <p className="text-xs text-zinc-500">Iuran non-rutin & bunga/bank</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold tabular-nums text-zinc-950">
              {formatRupiah(pendapatanLain.total || 900000)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MONTHS.map(mKey => {
            const mData = pendapatanLain.months?.[mKey] || { entries: [], subtotal: 0 };
            if (mData.entries.length === 0) return null;

            return (
              <div key={mKey} className="p-2 bg-zinc-50 rounded border border-zinc-200 text-xs">
                <div className="flex justify-between items-center text-[11px] font-semibold text-zinc-800 mb-1">
                  <span>{mKey}</span>
                  <span className="tabular-nums">{formatRupiah(mData.subtotal)}</span>
                </div>
                <div className="space-y-0.5">
                  {mData.entries.map((e, idx) => (
                    <div key={idx} className="text-[10px] flex justify-between text-zinc-600 bg-white p-1 rounded border border-zinc-100">
                      <span className="truncate mr-1">{e.keterangan || formatDate(e.tanggal)}</span>
                      <span className="tabular-nums font-medium text-zinc-900">{formatRupiah(e.nominal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimal Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full border border-zinc-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-zinc-900 uppercase tracking-wide">
                {modalType === 'member' ? 'Catat Iuran Anggota' : 'Catat Pendapatan Lain'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              {modalType === 'member' && (
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Anggota</label>
                  <select
                    value={formData.member}
                    onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-zinc-900 bg-white"
                  >
                    {members.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Bulan</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-zinc-900 bg-white"
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="200000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded font-semibold tabular-nums"
                  required
                  min="1000"
                />
              </div>

              {modalType === 'member' ? (
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Metode</label>
                  <input
                    type="text"
                    placeholder="Transfer BRI, Cash, Shopeepay"
                    value={formData.metode}
                    onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Sumber Dana</label>
                  <input
                    type="text"
                    placeholder="Bank Jago, Seabank"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
