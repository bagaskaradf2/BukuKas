import initialData from '../data/initialData.json';

const STORAGE_KEY_APPS_SCRIPT = 'bukukas_apps_script_url';
const STORAGE_KEY_AUDIT_LOGS = 'bukukas_audit_logs';

export function getAppsScriptUrl() {
  return localStorage.getItem(STORAGE_KEY_APPS_SCRIPT) || import.meta.env.VITE_APPS_SCRIPT_URL || '';
}

export function setAppsScriptUrl(url) {
  if (url) {
    localStorage.setItem(STORAGE_KEY_APPS_SCRIPT, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_APPS_SCRIPT);
  }
}

export function getAuditLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      user: 'Sistem',
      action: 'Inisialisasi',
      sheet: 'ALL',
      details: 'Aplikasi siap digunakan dengan data live Google Sheets (ID: 1LTrn9T9qN0WdpalnD_IvWrc2cGjNEuKP)'
    }
  ];
}

export function addAuditLog(entry) {
  const logs = getAuditLogs();
  const newEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...entry
  };
  logs.unshift(newEntry);
  if (logs.length > 100) logs.pop();
  localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
  return newEntry;
}

/**
 * Fetch all financial data
 */
export async function fetchAllData() {
  const scriptUrl = getAppsScriptUrl();

  // 1. Try Apps Script URL if provided
  if (scriptUrl) {
    try {
      const resp = await fetch(`${scriptUrl}?action=getAll`, { method: 'GET' });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.data) {
          return { data: json.data, source: 'apps-script', lastSync: new Date().toISOString() };
        }
      }
    } catch (err) {
      console.warn('Gagal fetch dari Apps Script, mencoba backend API...', err);
    }
  }

  // 2. Try backend API (/api/data)
  try {
    const resp = await fetch('/api/data');
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.data) {
        return { data: json.data, source: json.source || 'api', lastSync: new Date().toISOString() };
      }
    }
  } catch (err) {
    console.warn('API /api/data tidak tersedia, menggunakan data lokal...', err);
  }

  // 3. Fallback to initial bundled data
  return { data: initialData, source: 'local-seed', lastSync: new Date().toISOString() };
}

/**
 * Download live Excel file
 */
export function getLiveExcelDownloadUrl() {
  const spreadsheetId = '1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao';
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
}

/**
 * Save new Iuran
 */
export async function saveIuran(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'TAMBAH_IURAN',
    sheet: 'KARTU IURAN',
    details: `${payload.member} (${payload.month}): Rp ${Number(payload.nominal).toLocaleString('id-ID')} via ${payload.metode || 'Cash'}`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addIuran', ...payload })
    });
    return await resp.json();
  }

  // Fallback to local /api/iuran
  try {
    const resp = await fetch('/api/iuran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, user: userRole })
    });
    if (resp.ok) return await resp.json();
  } catch (e) {
    console.warn(e);
  }

  return { success: true, message: 'Iuran tersimpan lokal', localOnly: true };
}

/**
 * Save Pendapatan Lain-Lain
 */
export async function saveLainLainIuran(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'TAMBAH_PENDAPATAN_LAIN',
    sheet: 'KARTU IURAN',
    details: `${payload.keterangan || 'Pendapatan Lain'}: Rp ${Number(payload.nominal).toLocaleString('id-ID')}`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addLainLainIuran', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Pendapatan lain-lain tersimpan lokal', localOnly: true };
}

/**
 * Save Kas Transaction
 */
export async function saveKasTransaction(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'TRANSAKSI_KAS',
    sheet: 'BB KAS',
    details: `${payload.bulan || 'OKTOBER'} - ${payload.deskripsi}: Rp ${Number(payload.nominal).toLocaleString('id-ID')} (${payload.tipe})`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addBbKasTransaction', ...payload })
    });
    return await resp.json();
  }

  try {
    const resp = await fetch('/api/bb-kas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, user: userRole })
    });
    if (resp.ok) return await resp.json();
  } catch (e) {
    console.warn(e);
  }

  return { success: true, message: 'Transaksi kas tersimpan lokal', localOnly: true };
}

/**
 * Update RAB Harian Item
 */
export async function updateRabHarian(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'UPDATE_RAB_HARIAN',
    sheet: 'RAB HARIAN',
    details: `Baris ${payload.row}: ${payload.kebutuhan} (Vol: ${payload.volume} ${payload.satuan || ''} @ Rp ${payload.harga})`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateRabHarianItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Item RAB Harian tersimpan lokal', localOnly: true };
}

/**
 * Update RAB Proker Item
 */
export async function updateRabProker(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'UPDATE_RAB_PROKER',
    sheet: 'RAB PROKER',
    details: `Baris ${payload.row}: ${payload.kebutuhan} (Vol: ${payload.volume} @ Rp ${payload.harga})`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateRabProkerItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Item RAB Proker tersimpan lokal', localOnly: true };
}

/**
 * Update Vest Item
 */
export async function updateVest(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'UPDATE_VEST',
    sheet: 'LAIN LAIN',
    details: `Baris ${payload.row}: Ukuran ${payload.ukuran}, Status: ${payload.keterangan}`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateVestItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Data Vest tersimpan lokal', localOnly: true };
}

/**
 * Update Foto Studio Item
 */
export async function updateFotoStudio(payload, userRole = 'Bendahara') {
  const scriptUrl = getAppsScriptUrl();
  addAuditLog({
    user: userRole,
    action: 'UPDATE_FOTO_STUDIO',
    sheet: 'LAIN LAIN',
    details: `Baris ${payload.row}: Onomoto Rp ${payload.onomoto}, Kuy Studio Rp ${payload.kuyStudio}, Status: ${payload.keterangan}`
  });

  if (scriptUrl) {
    const resp = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateFotoStudioItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Data Foto Studio tersimpan lokal', localOnly: true };
}
