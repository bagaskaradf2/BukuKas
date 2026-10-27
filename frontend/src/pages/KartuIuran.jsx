import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatDate } from '../utils/formatters';
import { saveIuran, saveLainLainIuran } from '../services/api';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Table, 
  Grid, 
  CheckCircle, 
  Sparkles,
  Lock,
  ChevronDown,
  Info
} from 'lucide-react';

const MONTHS = ['FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER/OKTOBER'];

export default function KartuIuran() {
  const { data, setData, role, showToast, refreshLogs } = useApp();
  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const pendapatanLain = kartuIuran.pendapatanLain || {};

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'grid'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('member'); // 'member' or 'lain'
  const [formData, setFormData] = useState({
    member: 'SARAH',
    month: 'SEPTEMBER/OKTOBER',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    metode: 'Transfer Shopeepay',
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
      metode: 'Transfer Shopeepay',
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
      showToast('Nominal harus berupa angka positif!', 'error');
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
          showToast(`Iuran ${formData.member} sebesar ${formatRupiah(formData.nominal)} berhasil disimpan!`, 'success');
          // Update local state directly
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
        const res = await saveLainLainIuran({
          month: formData.month,
          tanggal: formData.tanggal,
          nominal: Number(formData.nominal),
          keterangan: formData.keterangan
        }, role);

        showToast(`Pendapatan lain-lain sebesar ${formatRupiah(formData.nominal)} berhasil dicatat!`, 'success');
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
      showToast('Gagal menyimpan iuran: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title & Actions Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2DDCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123326] tracking-tight">KARTU IURAN</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5E9] text-[#1B4332] border border-[#74C69D]">
              Tab Sheet: KARTU IURAN
            </span>
          </div>
          <p className="text-xs text-[#6C757D] mt-1">
            Agenda Iuran Rutin 10 Anggota KKN & Pendapatan Lain-Lain (Februari - September/Oktober)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch View Mode */}
          <div className="flex bg-[#F0EDE4] p-1 rounded-lg border border-[#E2DDCF]">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'card' ? 'bg-white text-[#123326] shadow-xs' : 'text-[#6C757D]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-white text-[#123326] shadow-xs' : 'text-[#6C757D]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Grid Asli</span>
            </button>
          </div>

          {/* Action buttons */}
          {role === 'Bendahara' && (
            <>
              <button
                onClick={() => handleOpenAdd()}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#123326] hover:bg-[#1B4332] text-white text-xs font-semibold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Iuran Anggota</span>
              </button>
              <button
                onClick={handleOpenAddLain}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#2D6A4F] hover:bg-[#40916C] text-white text-xs font-semibold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Pendapatan Lain</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8D99AE] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama anggota (Sarah, Yoga, dll)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-[#E2DDCF] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#6C757D]" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-[#E2DDCF] text-xs sm:text-sm font-medium text-[#123326] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          >
            <option value="ALL">Semua Bulan</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: CARD MODE */}
      {viewMode === 'card' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((m, idx) => {
              const activeMonths = selectedMonth === 'ALL' 
                ? MONTHS 
                : [selectedMonth];

              return (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E2DDCF] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE4]">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-[#123326] text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-base text-[#123326]">{m.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#6C757D]">Total Iuran:</span>
                        <div className="text-sm font-bold tabular-nums text-[#1B4332]">
                          {formatRupiah(m.total)}
                        </div>
                      </div>
                    </div>

                    {/* Months breakdown */}
                    <div className="mt-3 space-y-2.5">
                      {activeMonths.map((monthKey) => {
                        const monthData = m.months[monthKey] || { entries: [], subtotal: 0 };
                        const hasEntries = monthData.entries && monthData.entries.length > 0;

                        return (
                          <div key={monthKey} className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#EAE5D9]">
                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                              <span className="text-[#4A5D53]">{monthKey}</span>
                              <span className="tabular-nums font-bold text-[#123326]">
                                {formatRupiah(monthData.subtotal)}
                              </span>
                            </div>

                            {hasEntries ? (
                              <div className="space-y-1">
                                {monthData.entries.map((entry, eIdx) => (
                                  <div key={eIdx} className="flex items-center justify-between text-[11px] text-[#2D3748] bg-white p-1.5 rounded border border-[#E2DDCF]">
                                    <span className="text-[#6C757D] font-mono">
                                      {formatDate(entry.tanggal)}
                                    </span>
                                    <span className="font-semibold text-emerald-800 tabular-nums">
                                      {formatRupiah(entry.nominal)}
                                    </span>
                                    <span className="text-[#4A5D53] italic text-[10px]">
                                      {entry.metode || '-'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#A0AEC0] italic py-0.5">
                                Belum ada setoran
                              </div>
                            )}

                            {role === 'Bendahara' && monthData.entries.length < 5 && (
                              <button
                                onClick={() => handleOpenAdd(m.name, monthKey)}
                                className="mt-1.5 w-full py-1 text-center text-[11px] font-semibold text-[#2D6A4F] hover:bg-[#EAE5D9] rounded transition"
                              >
                                + Catat Setoran Bulan Ini
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pendapatan Lain-Lain Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2DDCF] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EDE4]">
              <div>
                <h3 className="font-bold text-base text-[#123326]">PENDAPATAN LAIN-LAIN</h3>
                <p className="text-xs text-[#6C757D]">Iuran Bank Jago & Seabank non-rutin</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#6C757D]">Total Terkumpul:</span>
                <div className="text-base font-bold tabular-nums text-[#2D6A4F]">
                  {formatRupiah(pendapatanLain.total || 900000)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MONTHS.map(monthKey => {
                const mData = pendapatanLain.months?.[monthKey] || { entries: [], subtotal: 0 };
                if (mData.entries.length === 0) return null;

                return (
                  <div key={monthKey} className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE5D9]">
                    <div className="flex justify-between items-center text-xs font-bold text-[#123326] mb-2">
                      <span>{monthKey}</span>
                      <span className="tabular-nums text-emerald-800">{formatRupiah(mData.subtotal)}</span>
                    </div>
                    <div className="space-y-1">
                      {mData.entries.map((e, idx) => (
                        <div key={idx} className="text-[11px] flex justify-between bg-white p-1.5 rounded border border-[#E2DDCF]">
                          <span className="font-mono text-[#6C757D]">{formatDate(e.tanggal)}</span>
                          <span className="font-semibold">{formatRupiah(e.nominal)}</span>
                          <span className="text-[#52796F]">{e.keterangan}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL SPREADSHEET GRID (Exact Sheet Replica) */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-[#E2DDCF] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF8F3] border-b border-[#E2DDCF] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#123326] flex items-center">
              <Table className="w-4 h-4 mr-1.5 text-[#2D6A4F]" />
              Replika Grid Asli Google Sheets: Tab KARTU IURAN
            </span>
            <span className="text-[11px] text-[#6C757D] flex items-center">
              <Lock className="w-3 h-3 mr-1 text-[#2D6A4F]" /> Formula Read-Only
            </span>
          </div>

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left text-[11px] border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-[#123326] text-white z-20">
                <tr>
                  <th className="py-2.5 px-3 border border-[#1B4332] font-bold w-12 text-center">NO</th>
                  <th className="py-2.5 px-3 border border-[#1B4332] font-bold w-40">ANGGOTA</th>
                  {MONTHS.map(m => (
                    <th key={m} className="py-2.5 px-3 border border-[#1B4332] font-bold text-center" colSpan={4}>
                      {m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 border border-[#1B4332] font-bold text-right w-32 bg-[#0D281E]">TOTAL</th>
                </tr>
                <tr className="bg-[#1B4332] text-[#D8F3DC] text-[10px]">
                  <th className="border border-[#2D6A4F]"></th>
                  <th className="border border-[#2D6A4F]"></th>
                  {MONTHS.map(m => (
                    <React.Fragment key={m}>
                      <th className="py-1 px-1.5 border border-[#2D6A4F] text-center w-6">NO</th>
                      <th className="py-1 px-2 border border-[#2D6A4F] text-center w-20">TANGGAL</th>
                      <th className="py-1 px-2 border border-[#2D6A4F] text-center w-24">NOMINAL</th>
                      <th className="py-1 px-2 border border-[#2D6A4F] text-center w-28">CASH/E-WALLET</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-[#2D6A4F]"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2DDCF]">
                {filteredMembers.map((m, idx) => (
                  <React.Fragment key={idx}>
                    {/* Header baris anggota */}
                    <tr className="bg-[#EAE5D9]/50 font-bold text-[#123326]">
                      <td className="py-2 px-3 border border-[#E2DDCF] text-center">{idx + 1}</td>
                      <td className="py-2 px-3 border border-[#E2DDCF]" colSpan={33}>
                        {m.name}
                      </td>
                      <td className="py-2 px-3 border border-[#E2DDCF] text-right tabular-nums bg-emerald-50 text-emerald-900 font-bold">
                        {formatRupiah(m.total)}
                      </td>
                    </tr>

                    {/* 5 Slots baris */}
                    {[0, 1, 2, 3, 4].map(slotIdx => (
                      <tr key={slotIdx} className="hover:bg-[#FAF8F3]">
                        <td className="py-1 px-2 border border-[#E2DDCF] text-center text-[#8D99AE]">
                          {slotIdx + 1}
                        </td>
                        <td className="py-1 px-2 border border-[#E2DDCF] text-[#8D99AE]">Slot {slotIdx + 1}</td>
                        {MONTHS.map(monthKey => {
                          const entry = m.months[monthKey]?.entries?.[slotIdx];
                          return (
                            <React.Fragment key={monthKey}>
                              <td className="py-1 px-1 text-center border border-[#E2DDCF] text-[#A0AEC0]">
                                {slotIdx + 1}
                              </td>
                              <td className="py-1 px-2 border border-[#E2DDCF] font-mono text-[#4A5D53]">
                                {entry ? formatDate(entry.tanggal) : ''}
                              </td>
                              <td className="py-1 px-2 border border-[#E2DDCF] text-right tabular-nums font-medium">
                                {entry ? formatNumber(entry.nominal) : ''}
                              </td>
                              <td className="py-1 px-2 border border-[#E2DDCF] text-[#52796F] text-[10px]">
                                {entry ? entry.metode : ''}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="py-1 px-2 border border-[#E2DDCF] bg-[#FAF8F3]"></td>
                      </tr>
                    ))}

                    {/* Subtotal baris anggota */}
                    <tr className="bg-[#FAF8F3] font-bold text-[#123326] border-b-2 border-[#D5CFC1]">
                      <td className="py-1.5 px-2 border border-[#E2DDCF]" colSpan={2}>
                        TOTAL {m.name}
                      </td>
                      {MONTHS.map(monthKey => {
                        const sub = m.months[monthKey]?.subtotal || 0;
                        return (
                          <React.Fragment key={monthKey}>
                            <td className="py-1.5 px-2 border border-[#E2DDCF] text-right tabular-nums text-[#1B4332]" colSpan={4}>
                              {formatRupiah(sub)}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="py-1.5 px-3 border border-[#E2DDCF] text-right tabular-nums bg-emerald-100 text-emerald-950">
                        {formatRupiah(m.total)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-[#123326] text-white p-6 rounded-2xl border border-[#0D281E] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#A7D7C5] uppercase tracking-wider font-semibold">Total Dana Terhimpun</span>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-white mt-1">
            {formatRupiah(kartuIuran.totalDanaKelompok || 17300000)}
          </div>
          <p className="text-xs text-[#74C69D] mt-1">
            Formula Asli: <code className="bg-[#1B4332] px-2 py-0.5 rounded font-mono">=AG113+AG128</code> (Total Iuran 10 Anggota + Pendapatan Lain)
          </p>
        </div>

        <div className="flex items-center space-x-6 text-xs sm:text-sm">
          <div className="bg-[#1B4332] p-3 rounded-xl border border-[#2D6A4F]">
            <span className="text-[#A7D7C5] block text-[11px]">Dana Bersih (AI130)</span>
            <span className="font-bold tabular-nums text-white text-base">
              {formatRupiah(kartuIuran.totalBersih || 16900000)}
            </span>
          </div>

          <div className="bg-[#1B4332] p-3 rounded-xl border border-[#2D6A4F]">
            <span className="text-[#A7D7C5] block text-[11px]">Alokasi Proker (AE136)</span>
            <span className="font-bold tabular-nums text-white text-base">
              {formatRupiah(kartuIuran.uangProker || 7000000)}
            </span>
          </div>
        </div>
      </div>

      {/* INPUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#D5CFC1] shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-[#123326] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base text-[#E8F5E9]">
                {modalType === 'member' ? 'Catat Setoran Iuran Anggota' : 'Catat Pendapatan Lain-Lain'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalType === 'member' && (
                <div>
                  <label className="block text-xs font-semibold text-[#123326] mb-1">Pilih Anggota</label>
                  <select
                    value={formData.member}
                    onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold text-[#123326]"
                  >
                    {members.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Bulan Agenda</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold text-[#123326]"
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Tanggal Bayar</label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123326] mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="Contoh: 200000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold tabular-nums"
                  required
                  min="1000"
                />
              </div>

              {modalType === 'member' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#123326] mb-1">Metode Pembayaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Transfer BRI, Cash, Dana"
                    value={formData.metode}
                    onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#123326] mb-1">Keterangan Sumber Dana</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank Jago Syifa, Seabank Hervi"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2DDCF] rounded-lg text-xs"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E2DDCF] rounded-lg text-xs font-semibold text-[#6C757D] hover:bg-[#FAF8F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#123326] hover:bg-[#1B4332] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
