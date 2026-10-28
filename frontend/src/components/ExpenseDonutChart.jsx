import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { ArrowRight } from 'lucide-react';

const CATEGORY_DEFINITIONS = [
  {
    id: 'konsumsi',
    name: 'Konsumsi & Pangan',
    color: '#f43f5e', // Rose
    match: (desc, ket) =>
      ket.includes('KONSUM') ||
      desc.includes('lauk') ||
      desc.includes('sayur') ||
      desc.includes('minyak') ||
      desc.includes('konsum') ||
      desc.includes('bawang') ||
      desc.includes('gula') ||
      desc.includes('penyedap') ||
      desc.includes('galon') ||
      desc.includes('snack') ||
      desc.includes('makan') ||
      desc.includes('beras') ||
      desc.includes('cabe')
  },
  {
    id: 'seragam',
    name: 'Seragam Anggota',
    color: '#6366f1', // Indigo
    match: (desc, ket) =>
      ket.includes('VEST') ||
      desc.includes('vest') ||
      desc.includes('seragam') ||
      desc.includes('baju') ||
      desc.includes('jaket')
  },
  {
    id: 'sekretariat',
    name: 'Sekretariat & Atribut',
    color: '#f59e0b', // Amber
    match: (desc, ket) =>
      ket.includes('ATRIBUT') ||
      desc.includes('banner') ||
      desc.includes('id card') ||
      desc.includes('lanyard') ||
      desc.includes('staples') ||
      desc.includes('kertas') ||
      desc.includes('print') ||
      desc.includes('fotokopi')
  },
  {
    id: 'posko',
    name: 'Operasional Posko',
    color: '#10b981', // Emerald
    match: (desc, ket) =>
      ket.includes('POSKO') ||
      desc.includes('gas') ||
      desc.includes('sabun') ||
      desc.includes('wipol') ||
      desc.includes('kebersihan') ||
      desc.includes('listrik') ||
      desc.includes('posko')
  },
  {
    id: 'digital',
    name: 'Media & Digital',
    color: '#0ea5e9', // Sky Blue
    match: (desc, ket) =>
      desc.includes('canva') ||
      desc.includes('premium') ||
      desc.includes('langganan') ||
      desc.includes('internet') ||
      desc.includes('pulsa') ||
      desc.includes('wifi')
  }
];

const FALLBACK_CATEGORY = {
  id: 'lainnya',
  name: 'Pengeluaran Lainnya',
  color: '#71717a' // Zinc Slate
};

export default function ExpenseDonutChart({ bbKas = {}, onNavigateToKas }) {
  const [selectedMonth, setSelectedMonth] = useState('OKTOBER');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Ambil transaksi pengeluaran sesuai bulan yang dipilih
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

  // Kategorisasi pengeluaran
  const categoryMap = {};
  CATEGORY_DEFINITIONS.forEach((cat) => {
    categoryMap[cat.id] = { ...cat, amount: 0 };
  });
  categoryMap[FALLBACK_CATEGORY.id] = { ...FALLBACK_CATEGORY, amount: 0 };

  expenseTxs.forEach((tx) => {
    const desc = (tx.deskripsi || '').toLowerCase();
    const ket = (tx.keterangan || '').toUpperCase();
    const matched = CATEGORY_DEFINITIONS.find((c) => c.match(desc, ket));
    const targetId = matched ? matched.id : FALLBACK_CATEGORY.id;
    categoryMap[targetId].amount += Number(tx.keluar) || 0;
  });

  const categories = Object.values(categoryMap)
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((c) => {
      const pct = totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0;
      return { ...c, pct };
    });

  // SVG Donut Math
  const r = 70;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * r;

  let accumulatedFraction = 0;
  const slices = categories.map((cat) => {
    const fraction = totalExpense > 0 ? cat.amount / totalExpense : 0;
    const sliceLength = fraction * circumference;
    const offset = -(accumulatedFraction * circumference);

    // Hitung posisi teks persentase di tengah busur
    const midAngleDeg = (accumulatedFraction + fraction / 2) * 360;
    const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180);
    const labelX = cx + r * Math.cos(midAngleRad);
    const labelY = cy + r * Math.sin(midAngleRad);

    accumulatedFraction += fraction;

    return {
      ...cat,
      fraction,
      sliceLength,
      offset,
      labelX,
      labelY
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
      
      {/* Header Card */}
      <div className="px-5 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
        <div>
          <h2 className="font-bold text-sm text-zinc-950">
            Distribusi Pengeluaran
          </h2>
          <span className="text-xs text-zinc-400 font-normal">
            Proporsi pengeluaran riil per kategori
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mini Month Filter */}
          <div className="flex items-center space-x-1 bg-zinc-200/60 p-0.5 rounded-lg text-[11px]">
            {['OKTOBER', 'NOVEMBER', 'DESEMBER', 'SEMUA'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {m === 'SEMUA' ? 'Semua' : m.slice(0, 3)}
              </button>
            ))}
          </div>

          {onNavigateToKas && (
            <button
              onClick={onNavigateToKas}
              className="text-xs text-zinc-500 hover:text-zinc-950 font-semibold inline-flex items-center space-x-1 cursor-pointer transition ml-1"
              title="Buka Buku Kas"
            >
              <span>Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content: Chart + List */}
      <div className="p-5">
        {totalExpense === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Belum ada catatan pengeluaran di periode {selectedMonth}.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* SVG Donut Chart */}
            <div className="relative w-56 h-56 flex items-center justify-center my-2">
              <svg viewBox="0 0 220 220" className="w-full h-full transform transition-all duration-300">
                {/* Background Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#f4f4f5"
                  strokeWidth="26"
                />

                {/* Slices */}
                {slices.map((slice) => {
                  const isHovered = hoveredCategory === slice.id;
                  return (
                    <g key={slice.id} onMouseEnter={() => setHoveredCategory(slice.id)} onMouseLeave={() => setHoveredCategory(null)}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? '30' : '26'}
                        strokeDasharray={`${slice.sliceLength} ${circumference}`}
                        strokeDashoffset={slice.offset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          opacity: hoveredCategory && !isHovered ? 0.6 : 1
                        }}
                      />
                      {slice.pct >= 6 && (
                        <text
                          x={slice.labelX}
                          y={slice.labelY}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none font-sans"
                        >
                          {slice.pct}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Center Info Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Pengeluaran
                </span>
                <span className="text-base sm:text-lg font-bold tabular-nums text-zinc-950 mt-0.5 block leading-tight">
                  {formatRupiah(totalExpense)}
                </span>
              </div>
            </div>

            {/* Category Breakdown List */}
            <div className="w-full divide-y divide-zinc-100 border-t border-zinc-100 mt-4">
              {categories.map((cat) => {
                const isHovered = hoveredCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`px-3 py-3 flex items-center justify-between text-xs transition-colors rounded-xl cursor-default ${
                      isHovered ? 'bg-zinc-100/70' : 'hover:bg-zinc-50/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs transition-transform"
                        style={{
                          backgroundColor: cat.color,
                          transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                        }}
                      />
                      <span className="font-semibold text-zinc-900 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 text-right">
                      <span className="font-semibold text-zinc-500 tabular-nums text-xs">
                        {cat.pct}%
                      </span>
                      <span className="font-bold text-zinc-950 tabular-nums text-xs">
                        {formatRupiah(cat.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
