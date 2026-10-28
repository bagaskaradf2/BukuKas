import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = login(username, password);
    if (res.success) {
      showToast('Berhasil masuk sebagai Bendahara.', 'success');
      setUsername('');
      setPassword('');
      setError('');
      setSubmitting(false);
      onClose();
    } else {
      setError(res.message || 'Username atau password salah.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-sm w-full border border-zinc-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-950">
                Login Bendahara
              </h2>
              <p className="text-[11px] text-zinc-400">
                Akses edit & pencatatan transaksi
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200/90 rounded-xl text-rose-700 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Bendahara"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
            >
              {submitting ? 'Memverifikasi...' : 'Masuk sebagai Bendahara'}
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 text-center pt-1">
            Mode tanpa login adalah <strong>Pembaca</strong> (hanya pantau).
          </p>
        </form>

      </div>
    </div>
  );
}
