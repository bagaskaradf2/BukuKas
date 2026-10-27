import initialData from '../data/initialData.json';

const SPREADSHEET_ID = '1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao';
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwIOsOelyDxvWfsMruLyFHUSUZJEKj3Xux1yg3rveZ-0E9k0M1RT3XFi_pnccy7aJXx/exec';
const STORAGE_KEY_AUDIT_LOGS = 'bukukas_audit_logs';

export function getAppsScriptUrl() {
  return APPS_SCRIPT_URL;
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
      details: 'Sistem aktif terhubung ke Google Sheets.'
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
  if (logs.length > 50) logs.pop();
  localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
  return newEntry;
}

export async function fetchAllData() {
  // 1. Direct Apps Script if ENV configured
  if (APPS_SCRIPT_URL) {
    try {
      const resp = await fetch(`${APPS_SCRIPT_URL}?action=getAll`, { method: 'GET' });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.data) {
          return { data: json.data, source: 'apps-script', lastSync: new Date().toLocaleTimeString('id-ID') };
        }
      }
    } catch (err) {
      console.warn('Apps script direct fetch error:', err);
    }
  }

  // 2. Local/Vercel Proxy (/api/data)
  try {
    const resp = await fetch('/api/data');
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.data) {
        return { data: json.data, source: json.source || 'api', lastSync: new Date().toLocaleTimeString('id-ID') };
      }
    }
  } catch (err) {
    console.warn('Proxy API error:', err);
  }

  // 3. Bundled dataset
  return { data: initialData, source: 'seed', lastSync: new Date().toLocaleTimeString('id-ID') };
}

export function getLiveExcelDownloadUrl() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
}

/**
 * SEKALI INPUT TERINTEGRASI:
 * Masuk ke Buku Kas + Terhubung ke RAB Harian/Proker ATAU Kartu Iuran
 */
export async function recordIntegratedTransaction(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: payload.jenis === 'Pemasukan' ? 'CATAT_PEMASUKAN' : 'CATAT_PENGELUARAN',
    sheet: 'INTEGRATED',
    details: `${payload.deskripsi}: Rp ${Number(payload.nominal).toLocaleString('id-ID')} (${payload.targetAlokasi || payload.member || 'Kas'})`
  });

  if (APPS_SCRIPT_URL) {
    try {
      const resp = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'recordIntegratedTransaction', ...payload })
      });
      return await resp.json();
    } catch (err) {
      console.warn('Integrated transaction Apps Script error:', err);
    }
  }

  return { success: true, message: 'Transaksi terintegrasi tersimpan', localOnly: true };
}

/**
 * Tambah Item Baru di RAB Harian
 */
export async function addRabHarianItem(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'TAMBAH_ITEM_RAB',
    sheet: 'RAB HARIAN',
    details: `${payload.category}: ${payload.kebutuhan} (Vol: ${payload.volume} ${payload.satuan || ''} @ Rp ${payload.harga})`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addRabHarianItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Item RAB Harian tersimpan lokal', localOnly: true };
}

export async function saveIuran(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'TAMBAH_IURAN',
    sheet: 'KARTU IURAN',
    details: `${payload.member} (${payload.month}): Rp ${Number(payload.nominal).toLocaleString('id-ID')} via ${payload.metode || 'Cash'}`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addIuran', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Iuran tersimpan lokal', localOnly: true };
}

export async function saveLainLainIuran(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'TAMBAH_PENDAPATAN_LAIN',
    sheet: 'KARTU IURAN',
    details: `${payload.keterangan || 'Pendapatan Lain'}: Rp ${Number(payload.nominal).toLocaleString('id-ID')}`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addLainLainIuran', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Pendapatan lain tersimpan lokal', localOnly: true };
}

export async function saveKasTransaction(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'TRANSAKSI_KAS',
    sheet: 'BB KAS',
    details: `${payload.bulan || 'OKTOBER'} - ${payload.deskripsi}: Rp ${Number(payload.nominal).toLocaleString('id-ID')} (${payload.tipe})`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addBbKasTransaction', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Transaksi kas tersimpan lokal', localOnly: true };
}

export async function updateRabHarian(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'UPDATE_RAB_HARIAN',
    sheet: 'RAB HARIAN',
    details: `Baris ${payload.row}: ${payload.kebutuhan} (Rp ${payload.harga})`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateRabHarianItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Item RAB Harian tersimpan lokal', localOnly: true };
}

export async function updateRabProker(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'UPDATE_RAB_PROKER',
    sheet: 'RAB PROKER',
    details: `Baris ${payload.row}: ${payload.kebutuhan} (Rp ${payload.harga})`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateRabProkerItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Item RAB Proker tersimpan lokal', localOnly: true };
}

export async function updateVest(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'UPDATE_VEST',
    sheet: 'LAIN LAIN',
    details: `Baris ${payload.row}: Ukuran ${payload.ukuran}, ${payload.keterangan}`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateVestItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Data seragam tersimpan lokal', localOnly: true };
}

export async function updateFotoStudio(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'UPDATE_FOTO_STUDIO',
    sheet: 'LAIN LAIN',
    details: `Baris ${payload.row}: Onomoto Rp ${payload.onomoto}, Kuy Rp ${payload.kuyStudio}`
  });

  if (APPS_SCRIPT_URL) {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateFotoStudioItem', ...payload })
    });
    return await resp.json();
  }

  return { success: true, message: 'Data foto studio tersimpan lokal', localOnly: true };
}
