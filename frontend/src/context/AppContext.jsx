import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAllData, getAuditLogs } from '../services/api';
import initialData from '../data/initialData.json';

const AppContext = createContext();

function normalizeData(rawData) {
  if (!rawData || !rawData.bbKas) return rawData;
  const clean = JSON.parse(JSON.stringify(rawData));
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
  return clean;
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => normalizeData(initialData));
  const [role, setRole] = useState(() => localStorage.getItem('bukukas_user_role') || 'Bendahara');
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [status, setStatus] = useState('Sinkron');
  const [dataSource, setDataSource] = useState('seed');
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString('id-ID'));
  const [loading, setLoading] = useState(false);
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
        if (!silent) showToast('Data tersinkronisasi otomatis.', 'success');
      }
    } catch (err) {
      console.warn(err);
      setStatus('Offline');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  // Realtime Auto-sync (Background polling + Window Focus)
  useEffect(() => {
    // Initial fetch
    refreshData(true);

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

  const toggleRole = () => {
    const nextRole = role === 'Bendahara' ? 'Pembaca' : 'Bendahara';
    setRole(nextRole);
    localStorage.setItem('bukukas_user_role', nextRole);
    showToast(`Mode akses: ${nextRole}`, 'info');
  };

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
        toggleRole,
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
