import React from 'react';
import { useApp } from '../context/AppContext';
import { X, History } from 'lucide-react';

export default function AuditModal({ isOpen, onClose }) {
  const { auditLogs } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full border border-[#E2E8F0] shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0F291E] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#74C69D]" />
            <h3 className="font-semibold text-sm text-white">Log Audit & Riwayat Perubahan</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-[#1B4D3E] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
          {auditLogs && auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E2E8F0] flex items-start justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#0F291E] text-white">
                      {log.sheet || 'SISTEM'}
                    </span>
                    <span className="font-semibold text-[#1E293B]">
                      {log.action}
                    </span>
                    <span className="text-[#64748B] text-[11px]">
                      oleh {log.user || 'Bendahara'}
                    </span>
                  </div>
                  <p className="text-[#334155] font-normal pt-0.5">
                    {log.details}
                  </p>
                </div>
                <div className="text-[11px] text-[#94A3B8] whitespace-nowrap ml-3 text-right">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-[#94A3B8]">
              Belum ada riwayat tercatat.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F8F9FA] px-5 py-2.5 flex justify-end border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[#0F291E] text-white text-xs font-medium hover:bg-[#1B4D3E] transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
