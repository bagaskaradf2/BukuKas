import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatDate, formatNumber } from '../utils/formatters';
import { saveIuran, saveLainLainIuran } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  X
} from 'lucide-react';

const MONTHS = ['FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER/OKTOBER'];

export default function KartuIuran() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const pendapatanLain = kartuIuran.pendapatanLain || {};

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [expandedMember, setExpandedMember] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('member'); // 'member' or 'lain'
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

  const handleOpenAdd = (memberName = 'SARAH', monthName = 'SEPTEMBER/OKTOBER') => {
    setModalType('member');
    setFormData({
      member: memberName,
      month: monthName,
      tanggal: new Date().toISOString().split('T')[0],
      nominal: '',
      metode: 'Transfer Bank',
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
          showToast(`Iuran ${formData.member} sebesar ${formatRupiah(formData.nominal)} berhasil disimpan.`, 'success');
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

        showToast(`Pendapatan lain-lain sebesar ${formatRupiah(formData.nominal)} berhasil disimpan.`, 'success');
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
    <div className="space-y-5 pb-10">
      
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9FA] rounded-md border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#0F291E]"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F8F9FA] rounded-md border border-[#E2E8F0] text-xs text-[#1E293B] focus:outline-none"
            >
              <option value="ALL">Semua Bulan</option>
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {role === 'Bendahara' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#0F291E] hover:bg-[#1B4D3E] text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Iuran Anggota</span>
            </button>
            <button
              onClick={handleOpenAddLain}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#25634F] text-white text-xs font-medium transition border border-[#2D6A4F]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pendapatan Lain</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Matrix */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-[#F8F9FA] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
          <span className="font-semibold text-[#0F291E]">Daftar Iuran Anggota</span>
          <span className="text-[#64748B]">Klik baris untuk melihat rincian setoran</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px] bg-[#FAFAFA]">
                <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                <th className="py-2.5 px-3 font-semibold w-40">Nama Anggota</th>
                {MONTHS.map(m => {
                  if (selectedMonth !== 'ALL' && selectedMonth !== m) return null;
                  return (
                    <th key={m} className="py-2.5 px-2.5 font-semibold text-right whitespace-nowrap">
                      {m.slice(0, 3)}
                    </th>
                  );
                })}
                <th className="py-2.5 px-3 font-semibold text-right w-32 bg-[#F1F5F9] text-[#0F291E]">
                  Total
                </th>
                <th className="py-2.5 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredMembers.map((m, idx) => {
                const isExpanded = expandedMember === m.name;

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedMember(isExpanded ? null : m.name)}
                      className={`hover:bg-[#F8F9FA] cursor-pointer transition-colors ${isExpanded ? 'bg-[#F1F5F9]/50' : ''}`}
                    >
                      <td className="py-2 px-3 text-center text-[#94A3B8] font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-[#1E293B]">{m.name}</td>
                      {MONTHS.map(monthKey => {
                        if (selectedMonth !== 'ALL' && selectedMonth !== monthKey) return null;
                        const sub = m.months[monthKey]?.subtotal || 0;
                        return (
                          <td key={monthKey} className="py-2 px-2.5 text-right tabular-nums text-[#334155]">
                            {sub > 0 ? formatNumber(sub) : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right tabular-nums font-semibold bg-[#F8F9FA] text-[#0F291E]">
                        {formatRupiah(m.total)}
                      </td>
                      <td className="py-2 px-2 text-center text-[#94A3B8]">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                    </tr>

                    {/* Expanded Details Drawer Row */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9FA]">
                        <td colSpan={selectedMonth === 'ALL' ? 11 : 4} className="p-4 border-y border-[#E2E8F0]">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#0F291E]">Rincian Setoran: {m.name}</span>
                              {role === 'Bendahara' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAdd(m.name);
                                  }}
                                  className="text-xs text-[#0F291E] font-medium hover:underline"
                                >
                                  + Tambah Setoran
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                              {MONTHS.map(mKey => {
                                const mData = m.months[mKey] || { entries: [], subtotal: 0 };
                                if (mData.entries.length === 0) return null;

                                return (
                                  <div key={mKey} className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] space-y-1">
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-[#0F291E] pb-1 border-b border-[#F1F5F9]">
                                      <span>{mKey}</span>
                                      <span className="tabular-nums">{formatRupiah(mData.subtotal)}</span>
                                    </div>
                                    <div className="space-y-1 pt-0.5">
                                      {mData.entries.map((e, eIdx) => (
                                        <div key={eIdx} className="text-[10px] flex justify-between text-[#64748B]">
                                          <span>{formatDate(e.tanggal)}</span>
                                          <span className="font-medium text-[#1E293B] tabular-nums">{formatRupiah(e.nominal)}</span>
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0F291E]">Pendapatan Lain-Lain</h3>
            <p className="text-xs text-[#64748B]">Setoran dana insidental / e-wallet</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#64748B] block">Total</span>
            <span className="text-sm font-semibold tabular-nums text-[#0F291E]">
              {formatRupiah(pendapatanLain.total || 900000)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {MONTHS.map(mKey => {
            const mData = pendapatanLain.months?.[mKey] || { entries: [], subtotal: 0 };
            if (mData.entries.length === 0) return null;

            return (
              <div key={mKey} className="bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E2E8F0]">
                <div className="flex justify-between items-center text-xs font-semibold text-[#0F291E] mb-1.5 pb-1 border-b border-[#E2E8F0]">
                  <span>{mKey}</span>
                  <span className="tabular-nums">{formatRupiah(mData.subtotal)}</span>
                </div>
                <div className="space-y-1">
                  {mData.entries.map((e, idx) => (
                    <div key={idx} className="text-[11px] flex justify-between bg-white p-1 rounded border border-[#E2E8F0]">
                      <span className="text-[#64748B]">{e.keterangan || formatDate(e.tanggal)}</span>
                      <span className="font-semibold tabular-nums text-[#1E293B]">{formatRupiah(e.nominal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-[#0F291E] text-white p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[#95D5B2] block text-[11px] uppercase tracking-wider">Total Kas Terhimpun</span>
          <div className="text-xl font-bold tabular-nums text-white mt-0.5">
            {formatRupiah(kartuIuran.totalDanaKelompok || 17300000)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-[#1B4D3E] px-3 py-1.5 rounded-md border border-[#2D6A4F]">
            <span className="text-[#95D5B2] block text-[10px]">Dana Bersih</span>
            <span className="font-semibold tabular-nums text-white">
              {formatRupiah(kartuIuran.totalBersih || 16900000)}
            </span>
          </div>

          <div className="bg-[#1B4D3E] px-3 py-1.5 rounded-md border border-[#2D6A4F]">
            <span className="text-[#95D5B2] block text-[10px]">Alokasi Proker</span>
            <span className="font-semibold tabular-nums text-white">
              {formatRupiah(kartuIuran.uangProker || 7000000)}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-[#E2E8F0] shadow-xl overflow-hidden">
            <div className="bg-[#0F291E] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {modalType === 'member' ? 'Catat Iuran Anggota' : 'Catat Pendapatan Lain'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {modalType === 'member' && (
                <div>
                  <label className="block font-medium text-[#1E293B] mb-1">Anggota</label>
                  <select
                    value={formData.member}
                    onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md font-medium text-[#1E293B]"
                  >
                    {members.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Bulan</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md font-medium text-[#1E293B]"
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#1E293B] mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="200000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md tabular-nums font-semibold"
                  required
                  min="1000"
                />
              </div>

              {modalType === 'member' ? (
                <div>
                  <label className="block font-medium text-[#1E293B] mb-1">Metode Pembayaran</label>
                  <input
                    type="text"
                    placeholder="Transfer BRI, Cash, dll"
                    value={formData.metode}
                    onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-[#1E293B] mb-1">Keterangan Sumber Dana</label>
                  <input
                    type="text"
                    placeholder="Bank Jago, Seabank, dll"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-md"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E2E8F0] rounded-md text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-[#0F291E] hover:bg-[#1B4D3E] text-white rounded-md font-medium transition disabled:opacity-50"
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
