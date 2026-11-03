import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { Search, PieChart } from 'lucide-react';

const COLOR_PALETTE = [
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#a855f7', // Purple
  '#0ea5e9', // Sky
  '#d97706', // Amber-600
  '#e11d48', // Rose-600
  '#2563eb', // Blue-600
  '#059669', // Emerald-600
  '#7c3aed', // Violet-600
  '#475569', // Slate-600
  '#71717a'  // Zinc-500
];

function normalizeDescriptionKey(desc) {
  if (!desc) return 'lainnya';
  let clean = desc.trim().toLowerCase();
  clean = clean.replace(/^(beli|bayar|isi)\s+/i, '').trim();
  return clean || 'lainnya';
}

function formatDescriptionTitle(desc) {
  if (!desc) return 'Pengeluaran Lainnya';
  let clean = desc.trim();
  clean = clean.replace(/^(beli|bayar|isi)\s+/i, '').trim();
  if (!clean) return desc.trim();
  return clean
    .split(/\s+/)
    .map(w => (w.length > 1 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function normalizePosName(rawPos, deskripsi) {
  let pos = (rawPos || '').trim();
  if (!pos) {
    const d = (deskripsi || '').toLowerCase();
    if (d.includes('lauk') || d.includes('sayur') || d.includes('minyak') || d.includes('galon') || d.includes('gas') || d.includes('bawang') || d.includes('gula') || d.includes('konsum')) return 'Konsumsi';
    if (d.includes('sabun') || d.includes('wipol') || d.includes('posko') || d.includes('kebersihan')) return 'Posko & Kebersihan';
    if (d.includes('canva') || d.includes('premium') || d.includes('langganan') || d.includes('wifi')) return 'Langganan Digital';
    if (d.includes('banner') || d.includes('print') || d.includes('staples') || d.includes('id card') || d.includes('sekre')) return 'Sekretariat';
    if (d.includes('vest') || d.includes('seragam')) return 'Seragam Anggota';
    return 'Lain-Lain';
  }

  const upper = pos.toUpperCase();
  if (upper === 'KONSUMSI') return 'Konsumsi';
  if (upper.includes('POSKO') || upper.includes('KEBERSIHAN')) return 'Posko & Kebersihan';
  if (upper.includes('SEKRE')) return 'Sekretariat';
  if (upper.includes('PENERJUNAN')) return 'Penerjunan';
  if (upper.includes('LANGGANAN')) return 'Langganan Digital';
  if (upper.includes('VEST') || upper.includes('SERAGAM')) return 'Seragam Anggota';
  if (upper.startsWith('PROKER_')) return 'Proker: ' + pos.replace('PROKER_', '');
  if (upper === 'LAIN-LAIN' || upper === 'LAIN LAIN' || upper === 'LAIN') return 'Lain-Lain';

  return pos.charAt(0).toUpperCase() + pos.slice(1);
}

function formatPercentage(fraction) {
  const p = fraction * 100;
  if (p < 0.1) return '<0.1%';
  if (p < 1) return `${p.toFixed(1)}%`;
  if (p < 10) return `${p.toFixed(1)}%`;
  return `${Math.round(p)}%`;
}

export default function ExpenseDonutChart({ 
  bbKas = {}, 
  mode = 'deskripsi', // 'deskripsi' | 'pos'
  title,
  subtitle
}) {
  const [selectedMonth, setSelectedMonth] = useState('OKTOBER');
  const [hoveredId, setHoveredId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Ambil transaksi pengeluaran sesuai bulan yang dipilih
  const getTransactions = () => {
    if (selectedMonth === 'SEMUA') {
      const all = [];
      Object.keys(bbKas).forEach((m) => {
        const txs = bbKas[m] || [];
        all.push(...txs);
      });
      return all.filter((t) => Number(t.keluar) > 0);
    }
    const currentList = bbKas[selectedMonth] || [];
    return currentList.filter((t) => Number(t.keluar) > 0);
  };

  const expenseTxs = getTransactions();
  const totalExpense = expenseTxs.reduce((sum, tx) => sum + (Number(tx.keluar) || 0), 0);

  // 2. Agregasi data sesuai mode ('deskripsi' atau 'pos')
  let categories = [];
  if (mode === 'deskripsi') {
    const groupMap = {};
    expenseTxs.forEach((tx) => {
      const key = normalizeDescriptionKey(tx.deskripsi);
      if (!groupMap[key]) {
        groupMap[key] = {
          id: key,
          name: formatDescriptionTitle(tx.deskripsi),
          amount: 0,
          count: 0
        };
      }
      groupMap[key].amount += Number(tx.keluar) || 0;
      groupMap[key].count += 1;
    });

    categories = Object.values(groupMap)
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((c, idx) => {
        const fraction = totalExpense > 0 ? c.amount / totalExpense : 0;
        return {
          ...c,
          fraction,
          pct: formatPercentage(fraction),
          color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
        };
      });
  } else {
    // Mode 'pos' (Alokasi Pos)
    const posMap = {};
    expenseTxs.forEach((tx) => {
      const posName = normalizePosName(tx.keterangan, tx.deskripsi);
      if (!posMap[posName]) {
        posMap[posName] = {
          id: posName,
          name: posName,
          amount: 0,
          count: 0
        };
      }
      posMap[posName].amount += Number(tx.keluar) || 0;
      posMap[posName].count += 1;
    });

    categories = Object.values(posMap)
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((c, idx) => {
        const fraction = totalExpense > 0 ? c.amount / totalExpense : 0;
        return {
          ...c,
          fraction,
          pct: formatPercentage(fraction),
          color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
        };
      });
  }

  // 3. Filter list berdasarkan pencarian
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. SVG Donut Math (Dimensi lebar & proporsional agar tidak berdempetan atau terpotong)
  const cx = 130;
  const cy = 130;
  const r = 88;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;

  let accumulatedFraction = 0;
  const slices = categories.map((cat) => {
    const fraction = cat.fraction;
    const sliceLength = fraction * circumference;
    const offset = -(accumulatedFraction * circumference);

    // Hitung posisi label teks di tengah busur slice
    const midAngleDeg = (accumulatedFraction + fraction / 2) * 360;
    const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180);
    const labelX = cx + r * Math.cos(midAngleRad);
    const labelY = cy + r * Math.sin(midAngleRad);

    accumulatedFraction += fraction;

    return {
      ...cat,
      sliceLength,
      offset,
      labelX,
      labelY
    };
  });

  const activeHoveredItem = hoveredId ? categories.find((c) => c.id === hoveredId) : null;

  const defaultTitle = mode === 'deskripsi' 
    ? 'Pengeluaran per Deskripsi Transaksi' 
    : 'Pengeluaran per Alokasi Pos';
  const defaultSubtitle = mode === 'deskripsi'
    ? 'Akumulasi belanja riil per nama barang (misal: Galon, Gas, Sayur)'
    : 'Proporsi pengeluaran riil berdasarkan pos anggaran kegiatan';

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
      
      {/* Header Card (Tanpa tombol switch yang mengganggu) */}
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-200/70 text-zinc-700 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4 text-zinc-600" />
            </div>
            <h2 className="font-bold text-sm text-zinc-950">
              {title || defaultTitle}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-normal mt-0.5 ml-9">
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Month Selector Pills */}
        <div className="flex items-center space-x-1 self-start sm:self-auto ml-9 sm:ml-0 bg-zinc-200/60 p-0.5 rounded-xl text-[11px] shrink-0">
          {['OKTOBER', 'NOVEMBER', 'DESEMBER', 'SEMUA'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setSelectedMonth(m);
                setHoveredId(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                selectedMonth === m
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {m === 'SEMUA' ? 'Semua' : m.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Donut + List */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        {totalExpense === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400 font-medium">
            Belum ada catatan pengeluaran kas di periode {selectedMonth}.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* SVG Donut Chart (Area Lega 260x260, Lubang Tengah 152px) */}
            <div className="relative w-64 h-64 flex items-center justify-center my-3 mx-auto">
              <svg 
                viewBox="0 0 260 260" 
                className="w-full h-full transform transition-all duration-300"
              >
                {/* Background Track Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#f4f4f5"
                  strokeWidth={strokeWidth}
                />

                {/* Slices */}
                {slices.map((slice) => {
                  const isHovered = hoveredId === slice.id;
                  const hasAnyHover = Boolean(hoveredId);

                  return (
                    <g 
                      key={slice.id} 
                      onMouseEnter={() => setHoveredId(slice.id)} 
                      onMouseLeave={() => setHoveredId(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                        strokeDasharray={`${slice.sliceLength} ${circumference}`}
                        strokeDashoffset={slice.offset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className="transition-all duration-200"
                        style={{
                          opacity: hasAnyHover && !isHovered ? 0.35 : 1
                        }}
                      />
                      {/* Label persentase di dalam irisan (hanya untuk irisan lebar >= 7.5% agar tidak terpotong) */}
                      {slice.fraction >= 0.075 && (
                        <text
                          x={slice.labelX}
                          y={slice.labelY}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none font-sans drop-shadow-xs"
                        >
                          {Math.round(slice.fraction * 100)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Center Info Hole (Lega, Bersih, Tidak Menabrak Garis) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
                {activeHoveredItem ? (
                  <div className="space-y-0.5 max-w-[145px] animate-in fade-in zoom-in-95 duration-150">
                    <span 
                      className="text-[11px] font-bold uppercase tracking-wider block truncate"
                      style={{ color: activeHoveredItem.color }}
                    >
                      {activeHoveredItem.name}
                    </span>
                    <span className="text-lg sm:text-xl font-bold tabular-nums text-zinc-950 block leading-tight">
                      {formatRupiah(activeHoveredItem.amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500 block">
                      {activeHoveredItem.pct} {activeHoveredItem.count > 1 ? `• ${activeHoveredItem.count}x` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5 max-w-[145px]">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Total Pengeluaran
                    </span>
                    <span className="text-lg sm:text-xl font-bold tabular-nums text-zinc-950 block leading-tight">
                      {formatRupiah(totalExpense)}
                    </span>
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      {categories.length} {mode === 'deskripsi' ? 'item belanja' : 'pos alokasi'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subheader: Rincian & Search */}
            <div className="w-full mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 px-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Rincian {mode === 'deskripsi' ? 'Item Pengeluaran' : 'Alokasi Pos'} ({categories.length})
              </span>

              {categories.length > 5 && (
                <div className="relative w-36 sm:w-44">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 text-xs bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                  />
                </div>
              )}
            </div>

            {/* Category / Description Breakdown List */}
            <div className="w-full divide-y divide-zinc-100 max-h-[340px] overflow-y-auto pr-1.5 mt-2">
              {filteredCategories.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 font-medium">
                  Tidak ditemukan data yang cocok dengan "{searchQuery}".
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isHovered = hoveredId === cat.id;
                  const hasAnyHover = Boolean(hoveredId);

                  return (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setHoveredId(cat.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`px-3 py-2.5 flex items-center justify-between text-xs transition-colors rounded-xl cursor-pointer ${
                        isHovered 
                          ? 'bg-zinc-100' 
                          : hasAnyHover 
                            ? 'opacity-40 hover:opacity-100' 
                            : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs transition-transform"
                          style={{
                            backgroundColor: cat.color,
                            transform: isHovered ? 'scale(1.25)' : 'scale(1)'
                          }}
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-900 block truncate">
                            {cat.name}
                          </span>
                          {cat.count > 1 && mode === 'deskripsi' && (
                            <span className="text-[10px] text-zinc-400 block font-normal">
                              Dibeli {cat.count}x
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3.5 shrink-0 text-right">
                        <span className="font-semibold text-zinc-500 tabular-nums text-xs min-w-[38px]">
                          {cat.pct}
                        </span>
                        <span className="font-bold text-zinc-950 tabular-nums text-xs">
                          {formatRupiah(cat.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
