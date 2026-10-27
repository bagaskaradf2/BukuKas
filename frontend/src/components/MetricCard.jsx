import React from 'react';

export default function MetricCard({ title, amount, subtitle, icon: Icon, badge, variant = 'default' }) {
  const variantStyles = {
    default: 'border-[#E2DDCF] bg-white text-[#1B4332]',
    forest: 'border-[#1B4332] bg-[#123326] text-white',
    emerald: 'border-[#74C69D] bg-[#E8F5E9] text-[#1B4332]',
    amber: 'border-[#FFE082] bg-[#FFFDE7] text-[#5D4037]',
  };

  const isForest = variant === 'forest';

  return (
    <div className={`p-4 sm:p-5 rounded-xl border shadow-xs transition-all hover:shadow-md ${variantStyles[variant] || variantStyles.default}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold tracking-wider uppercase ${isForest ? 'text-[#95D5B2]' : 'text-[#6C757D]'}`}>
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${isForest ? 'bg-[#1B4332] text-[#74C69D]' : 'bg-[#F4F1EA] text-[#2D6A4F]'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${isForest ? 'text-white' : 'text-[#123326]'}`}>
          {amount}
        </h3>
      </div>

      {(subtitle || badge) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          {subtitle && (
            <span className={isForest ? 'text-[#74C69D]' : 'text-[#52796F]'}>
              {subtitle}
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
