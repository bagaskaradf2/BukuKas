import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAllData, getAuditLogs } from '../services/api';
import initialData from '../data/initialData.json';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [role, setRole] = useState(() => localStorage.getItem('bukukas_user_role') || 'Bendahara');
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [status, setStatus] = useState('Tersimpan');
  const [dataSource, setDataSource] = useState('local-seed');
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString('id-ID'));
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [logs, setLogs] = useState(getAuditLogs);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setStatus('Sinkronisasi...');
    try {
      const res = await fetchAllData();
      if (res && res.data) {
        setData(res.data);
        setDataSource(res.source);
        setLastSync(new Date().toLocaleTimeString('id-ID'));
        setStatus('Tersimpan');
        if (!silent) showToast('Data terbaru Google Sheets berhasil dimuat!', 'success');
      }
    } catch (err) {
      console.error(err);
      setStatus('Periksa Koneksi');
      if (!silent) showToast('Gagal menyinkronkan data Google Sheets: ' + err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData(true);
  }, [refreshData]);

  const toggleRole = () => {
    const nextRole = role === 'Bendahara' ? 'Pembaca' : 'Bendahara';
    setRole(nextRole);
    localStorage.setItem('bukukas_user_role', nextRole);
    showToast(`Mode akses beralih ke: ${nextRole}`, 'info');
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
        refreshLogs: () => setLogs(getAuditLogs())
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
