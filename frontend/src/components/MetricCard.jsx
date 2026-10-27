import React from 'react';

export default function MetricCard({ title, amount, subtitle, badge }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-zinc-200">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2">
        <h3 className="text-2xl font-bold tabular-nums tracking-tight text-zinc-950">
          {amount}
        </h3>
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
