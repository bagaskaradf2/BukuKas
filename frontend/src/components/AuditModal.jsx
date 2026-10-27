import React from 'react';
import { useApp } from '../context/AppContext';
import { X, History, ShieldAlert, CheckCircle, FileText } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function AuditModal({ isOpen, onClose }) {
  const { auditLogs } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F3] rounded-2xl max-w-2xl w-full border border-[#D5CFC1] shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="bg-[#123326] text-white px-6 py-4 flex items-center justify-between border-b border-[#0A1F17]">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#74C69D]" />
            <h3 className="font-bold text-base text-[#E8F5E9]">Log Audit & Riwayat Perubahan</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-[#1B4332] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="text-xs text-[#52796F] mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            Setiap perubahan data dicatat otomatis dengan waktu kejadian, user, tab target, dan rincian transaksi untuk menjaga integritas data keuangan KKN.
          </div>

          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-white rounded-xl border border-[#E2DDCF] shadow-xs flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#1B4332] text-white">
                        {log.sheet || 'SISTEM'}
                      </span>
                      <span className="text-xs font-semibold text-[#123326]">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-[#6C757D]">
                        oleh <strong className="text-[#2D6A4F]">{log.user || 'Bendahara'}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-[#2D3748] font-medium">
                      {log.details}
                    </p>
                  </div>
                  <div className="text-[11px] text-[#8D99AE] whitespace-nowrap ml-3 text-right">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    <div className="text-[10px] text-[#A0AEC0]">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-[#6C757D]">
              Belum ada riwayat perubahan yang tercatat.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#EAE5D9] px-6 py-3 flex justify-end border-t border-[#D5CFC1]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#123326] text-white text-xs font-semibold hover:bg-[#1B4332] transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
