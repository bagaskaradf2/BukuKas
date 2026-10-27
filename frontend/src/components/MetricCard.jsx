import React from 'react';

export default function MetricCard({ title, amount, subtitle, icon: Icon, badge, variant = 'default' }) {
  const isForest = variant === 'forest';

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isForest 
        ? 'bg-[#0F291E] border-[#1A382B] text-white shadow-xs' 
        : 'bg-white border-[#E2E8F0] text-[#0F291E] shadow-2xs'
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold tracking-wider uppercase ${isForest ? 'text-[#95D5B2]' : 'text-[#64748B]'}`}>
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-md ${isForest ? 'bg-[#1B4D3E] text-[#74C69D]' : 'bg-[#F1F5F9] text-[#0F291E]'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <h3 className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${isForest ? 'text-white' : 'text-[#0F291E]'}`}>
          {amount}
        </h3>
      </div>

      {(subtitle || badge) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && (
            <span className={isForest ? 'text-[#74C69D]' : 'text-[#64748B]'}>
              {subtitle}
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
