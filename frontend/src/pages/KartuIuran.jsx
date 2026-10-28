import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatDate, formatNumber } from '../utils/formatters';
import { Search, ChevronRight, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

const MONTHS = ['FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER/OKTOBER', 'NOVEMBER/DESEMBER'];
const TARGET_PER_MEMBER = 1600000;

export default function KartuIuran() {
  const { data, loading } = useApp();
  const kartuIuran = data?.kartuIuran || {};
  const members = kartuIuran.members || [];
  const pendapatanLain = kartuIuran.pendapatanLain || {};

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [expandedMember, setExpandedMember] = useState(null);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      
      {/* Top Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
            Kartu Iuran Anggota
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Target iuran: <strong className="text-zinc-800 font-semibold">{formatRupiah(TARGET_PER_MEMBER)}</strong> per orang
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-zinc-400 focus:bg-white transition"
          >
            <option value="ALL">Semua Bulan</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200/90 text-zinc-500 font-semibold text-[11px]">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3 w-48">Anggota</th>
                {MONTHS.map(m => {
                  if (selectedMonth !== 'ALL' && selectedMonth !== m) return null;
                  return (
                    <th key={m} className="py-3 px-3 text-right whitespace-nowrap">
                      {m.slice(0, 3)}
                    </th>
                  );
                })}
                <th className="py-3 px-4 text-right w-44 bg-zinc-100/60 font-bold text-zinc-950">
                  Total Terkumpul
                </th>
                <th className="py-3 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={selectedMonth === 'ALL' ? 11 : 4} className="py-12 text-center text-xs text-zinc-400">
                    {loading ? 'Memuat data kartu iuran dari Google Spreadsheet...' : 'Belum ada data anggota (data kosong atau belum terhubung ke Spreadsheet).'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => {
                const isExpanded = expandedMember === m.name;
                const current = Number(m.total) || 0;
                const isLunas = current >= TARGET_PER_MEMBER;

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedMember(isExpanded ? null : m.name)}
                      className={`hover:bg-zinc-50/80 cursor-pointer transition-colors ${isExpanded ? 'bg-zinc-50/60' : ''}`}
                    >
                      <td className="py-3 px-3 text-center text-zinc-400 font-medium tabular-nums">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900">{m.name}</td>
                      {MONTHS.map(monthKey => {
                        if (selectedMonth !== 'ALL' && selectedMonth !== monthKey) return null;
                        const sub = m.months?.[monthKey]?.subtotal || 0;
                        return (
                          <td key={monthKey} className="py-3 px-3 text-right tabular-nums text-zinc-700 font-medium">
                            {sub > 0 ? formatNumber(sub) : '-'}
                          </td>
                        );
                      })}
                      <td className={`py-3 px-4 text-right tabular-nums font-bold ${
                        isLunas ? 'text-emerald-700 bg-emerald-50/30' : 'text-zinc-950 bg-zinc-50/50'
                      }`}>
                        {formatRupiah(m.total)}
                      </td>
                      <td className="py-3 px-2 text-center text-zinc-400">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                    </tr>

                    {/* Inline Expandable Drawer */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/60">
                        <td colSpan={selectedMonth === 'ALL' ? 11 : 4} className="p-4 sm:p-5 border-y border-zinc-200/80">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-zinc-900">
                                Rincian Mutasi Setoran: <span className="text-emerald-700">{m.name}</span>
                              </div>
                              <div className="text-xs">
                                {isLunas ? (
                                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Lunas Target</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Kurang {formatRupiah(TARGET_PER_MEMBER - current)}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {MONTHS.map(mKey => {
                                const mData = m.months?.[mKey] || { entries: [], subtotal: 0 };
                                if (mData.entries.length === 0) return null;

                                return (
                                  <div key={mKey} className="bg-white p-3 rounded-xl border border-zinc-200 text-xs shadow-2xs">
                                    <div className="flex justify-between font-semibold text-zinc-800 text-[11px] pb-1.5 border-b border-zinc-100">
                                      <span>{mKey}</span>
                                      <span className="tabular-nums font-bold text-zinc-950">{formatRupiah(mData.subtotal)}</span>
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                      {mData.entries.map((e, eIdx) => (
                                        <div key={eIdx} className="text-[11px] flex justify-between text-zinc-500">
                                          <span>{formatDate(e.tanggal)} • {e.metode || 'Cash'}</span>
                                          <span className="tabular-nums font-semibold text-zinc-900">{formatRupiah(e.nominal)}</span>
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
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pendapatan Lain-Lain */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide text-zinc-950">Pendapatan Lain-Lain</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Iuran non-rutin & kas insidental</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold tabular-nums text-emerald-700">
              {formatRupiah(pendapatanLain.total || 900000)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {MONTHS.map(mKey => {
            const mData = pendapatanLain.months?.[mKey] || { entries: [], subtotal: 0 };
            if (mData.entries.length === 0) return null;

            return (
              <div key={mKey} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-800 mb-2">
                  <span>{mKey}</span>
                  <span className="tabular-nums text-emerald-700">{formatRupiah(mData.subtotal)}</span>
                </div>
                <div className="space-y-1.5">
                  {mData.entries.map((e, idx) => (
                    <div key={idx} className="text-[11px] flex justify-between text-zinc-500">
                      <span>{e.keterangan || 'Kas'}</span>
                      <span className="tabular-nums font-semibold text-zinc-900">{formatRupiah(e.nominal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
