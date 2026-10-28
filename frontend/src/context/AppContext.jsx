import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAllData, getAuditLogs } from '../services/api';
import Toast from '../components/Toast';
import RecordModal from '../components/RecordModal';

const AppContext = createContext();

function normalizeData(rawData) {
  if (!rawData) return rawData;
  const clean = JSON.parse(JSON.stringify(rawData));

  // 1. Forward-fill tanggal di BB Kas
  if (clean.bbKas) {
    for (const m of Object.keys(clean.bbKas)) {
      const list = clean.bbKas[m] || [];
      let lastTgl = 1;
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (t.tanggal !== null && t.tanggal !== undefined && t.tanggal !== '' && t.tanggal !== '-' && !isNaN(t.tanggal)) {
          lastTgl = Number(t.tanggal);
          t.tanggal = lastTgl;
        } else {
          t.tanggal = lastTgl;
        }
      }
    }
  }

  // 2. Hitung subtotal dan total anggaran RAB Harian
  if (clean.rabHarian && Array.isArray(clean.rabHarian)) {
    clean.rabHarian.forEach(cat => {
      const sum = (cat.items || []).reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
      cat.total = sum > 0 ? sum : (Number(cat.total) || 0);
    });
  }

  // 3. Hitung subtotal dan total anggaran RAB Proker
  if (clean.rabProker && Array.isArray(clean.rabProker)) {
    clean.rabProker.forEach(blk => {
      const sum = (blk.items || []).reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
      blk.total = sum > 0 ? sum : (Number(blk.total) || 0);
    });
  }

  // 4. Pastikan kartu iuran anggota memiliki struktur bulan lengkap (termasuk NOVEMBER/DESEMBER)
  if (clean.kartuIuran && Array.isArray(clean.kartuIuran.members)) {
    const allMonths = ['FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER/OKTOBER', 'NOVEMBER/DESEMBER'];
    clean.kartuIuran.members.forEach(mem => {
      if (!mem.months) mem.months = {};
      allMonths.forEach(mKey => {
        if (!mem.months[mKey]) {
          mem.months[mKey] = { entries: [], subtotal: 0 };
        }
      });
    });
  }

  return clean;
}

export function AppProvider({ children }) {
  // Tanpa data dummy di awal: data mulai dari null / kosong hingga berhasil fetch dari spreadsheet
  const [data, setData] = useState(null);
  // Default role adalah 'Pembaca'. Pengguna harus login untuk menjadi 'Bendahara'
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('bukukas_auth');
    return saved === 'Bendahara' ? 'Bendahara' : 'Pembaca';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [status, setStatus] = useState('Menghubungkan...');
  const [dataSource, setDataSource] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [logs, setLogs] = useState(getAuditLogs);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchAllData();
      if (res && res.data) {
        setData(normalizeData(res.data));
        setDataSource(res.source);
        setLastSync(new Date().toLocaleTimeString('id-ID'));
        setStatus('Sinkron');
        if (!silent) showToast('Data live spreadsheet berhasil dimuat.', 'success');
      } else {
        // Jika belum terhubung atau kosong
        setStatus('Belum Terhubung');
        if (!silent) showToast('Belum terhubung ke spreadsheet.', 'error');
      }
    } catch (err) {
      console.warn(err);
      setStatus('Offline');
      if (!silent) showToast('Gagal memuat: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Realtime Auto-sync (Background polling + Window Focus)
  useEffect(() => {
    // Initial fetch dari spreadsheet
    refreshData(false);

    // Auto sync on window focus
    const onFocus = () => refreshData(true);
    window.addEventListener('focus', onFocus);

    // Polling background every 12 seconds
    const interval = setInterval(() => {
      refreshData(true);
    }, 12000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [refreshData]);

  const login = useCallback((username, password) => {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (cleanUser === 'bendahara' && cleanPass === 'bendahara123') {
      setRole('Bendahara');
      localStorage.setItem('bukukas_auth', 'Bendahara');
      return { success: true };
    }
    return { success: false, message: 'Username atau password salah. Silakan coba lagi.' };
  }, []);

  const logout = useCallback(() => {
    setRole('Pembaca');
    localStorage.removeItem('bukukas_auth');
    localStorage.removeItem('bukukas_user_role');
    showToast('Berhasil keluar. Mode akses kembali ke Pembaca.', 'info');
  }, [showToast]);

  const updateLocalData = (updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...next };
    });
    setLogs(getAuditLogs());
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setData: updateLocalData,
        role,
        login,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        activeTab,
        setActiveTab,
        status,
        setStatus,
        dataSource,
        lastSync,
        loading,
        refreshData,
        toast,
        showToast,
        auditLogs: logs,
        refreshLogs: () => setLogs(getAuditLogs()),
        isRecordModalOpen,
        setIsRecordModalOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
