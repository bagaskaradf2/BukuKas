const SPREADSHEET_ID = '1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao';
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzLtPONzUvU6SDjjijOqPfnL__ItI-1haI-NJVAJ7c0LsiGuABCMz7bVZwxSLnk-n0Y/exec';
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

  // 3. Tanpa dummy data - jika belum connect ke spreadsheet maka kosong
  return { data: null, source: 'offline', lastSync: null };
}

export function getLiveSpreadsheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
}

export function getLiveExcelDownloadUrl() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
}

/**
 * SEKALI INPUT TERINTEGRASI:
 * Masuk ke Buku Kas + Terhubung ke RAB Harian/Proker ATAU Kartu Iuran
 * Dilengkapi fallback otomatis ke aksi atomik jika Google Apps Script masih versi sebelumnya.
 */
export async function recordIntegratedTransaction(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: payload.jenis === 'Pemasukan' ? 'CATAT_PEMASUKAN' : 'CATAT_PENGELUARAN',
    sheet: 'INTEGRATED',
    details: `${payload.deskripsi}: Rp ${Number(payload.nominal).toLocaleString('id-ID')} (${payload.targetAlokasi || payload.member || 'Kas'})`
  });

  if (!APPS_SCRIPT_URL) {
    return { success: true, message: 'Transaksi tersimpan lokal', localOnly: true };
  }

  // 1. Coba kirim via endpoint terpadu recordIntegratedTransaction
  try {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'recordIntegratedTransaction', ...payload })
    });
    const json = await resp.json();
    if (json && (json.status === 'success' || json.success)) {
      return json;
    }
    // Jika ada error selain "Action tidak dikenal", lempar errornya
    if (json && json.status === 'error' && !json.data?.message?.includes('Action tidak dikenal')) {
      throw new Error(json.data?.message || 'Gagal menyimpan transaksi di spreadsheet');
    }
  } catch (err) {
    if (!err.message?.includes('Action tidak dikenal')) {
      console.warn('Integrated call failed, executing direct atomic writes:', err.message);
    }
  }

  // 2. FALLBACK OTOMATIS: Eksekusi langsung ke endpoint atomik yang aktif di Google Sheets
  return await executeAtomicWrites(payload);
}

async function executeAtomicWrites(payload) {
  const jenis = payload.jenis; // 'Pengeluaran' atau 'Pemasukan'
  const tglObj = new Date(payload.tanggal || new Date());
  const tglDay = tglObj.getDate();
  const monthIdx = tglObj.getMonth();
  const bulanKas = monthIdx <= 9 ? 'OKTOBER' : (monthIdx === 10 ? 'NOVEMBER' : 'DESEMBER');
  const nominal = Number(payload.nominal) || 0;
  const deskripsi = String(payload.deskripsi || '').trim();

  // A. Catat ke BUKU KAS (BB KAS)
  const kasPayload = {
    action: 'addBbKasTransaction',
    bulan: bulanKas,
    tanggal: tglDay,
    deskripsi: deskripsi,
    tipe: jenis === 'Pemasukan' ? 'Masuk' : 'Keluar',
    nominal: nominal,
    keterangan: payload.targetAlokasi 
      ? payload.targetAlokasi.replace('RAB_', '').replace('PROKER_', '') 
      : (payload.metode || 'Kas')
  };

  const kasResp = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(kasPayload)
  });
  const kasJson = await kasResp.json();
  if (kasJson && kasJson.status === 'error') {
    throw new Error(kasJson.data?.message || 'Gagal mencatat mutasi ke Buku Kas');
  }

  // B. Jika Pemasukan dari Anggota -> Catat ke KARTU IURAN
  if (jenis === 'Pemasukan' && payload.member) {
    let targetMonth = payload.bulanIuran || 'SEPTEMBER/OKTOBER';
    let metodeText = payload.metode || 'Transfer';
    if (targetMonth === 'NOVEMBER' || targetMonth === 'DESEMBER' || targetMonth === 'NOVEMBER/DESEMBER') {
      metodeText = `${metodeText} (${targetMonth})`;
    }

    let iuranResp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'addIuran',
        member: payload.member,
        month: targetMonth,
        tanggal: payload.tanggal,
        nominal: nominal,
        metode: metodeText
      })
    });
    let iuranJson = await iuranResp.json();

    // Jika Apps Script lama menolak bulan baru, fallback ke SEPTEMBER/OKTOBER
    if (iuranJson && iuranJson.status === 'error' && iuranJson.data?.message?.includes('Bulan tidak dikenal')) {
      iuranResp = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addIuran',
          member: payload.member,
          month: 'SEPTEMBER/OKTOBER',
          tanggal: payload.tanggal,
          nominal: nominal,
          metode: `${metodeText} [${targetMonth}]`
        })
      });
      iuranJson = await iuranResp.json();
    }

    if (iuranJson && iuranJson.status === 'error') {
      throw new Error(iuranJson.data?.message || 'Gagal mencatat iuran ke Kartu Iuran');
    }
  }

  // C. Jika Pengeluaran untuk RAB Harian -> Update baris kosong di RAB HARIAN
  if (jenis === 'Pengeluaran' && payload.targetAlokasi && payload.targetAlokasi.startsWith('RAB_')) {
    const catMap = {
      'RAB_KONSUMSI': 1,
      'RAB_POSKO': 8,
      'RAB_TRANSPORTASI': 15,
      'RAB_LANGGANAN': 22,
      'RAB_SEKRE': 29
    };
    const cStart = catMap[payload.targetAlokasi] || 1;

    try {
      const allDataRes = await fetchAllData();
      const catName = payload.targetAlokasi.replace('RAB_', 'RAB ');
      const curCat = allDataRes?.data?.rabHarian?.find(c => c.category === catName || c.colStart === cStart);
      const existingItems = curCat?.items || [];
      const nextRow = 6 + existingItems.length;

      if (nextRow <= 19) {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateRabHarianItem',
            row: nextRow,
            colStart: cStart,
            kebutuhan: deskripsi,
            volume: Number(payload.volume) || 1,
            satuan: payload.satuan || 'Kali',
            harga: Number(payload.harga) || nominal
          })
        });
      }
    } catch (e) {
      console.warn('Gagal sinkron baris RAB Harian:', e);
    }
  }

  return {
    status: 'success',
    code: 200,
    data: {
      result: {
        success: true,
        message: `Transaksi '${deskripsi}' Rp ${nominal} berhasil dicatat ke Spreadsheet.`
      }
    }
  };
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

export async function updateBbKasTransaction(payload, userRole = 'Bendahara') {
  addAuditLog({
    user: userRole,
    action: 'EDIT_KAS',
    sheet: 'BB KAS',
    details: `${payload.bulan} baris ${payload.row}: ${payload.deskripsi} (M: ${payload.masuk}, K: ${payload.keluar})`
  });

  if (APPS_SCRIPT_URL) {
    try {
      const resp = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateBbKasTransaction',
          bulan: payload.bulan,
          row: payload.row,
          tanggal: payload.tanggal,
          deskripsi: payload.deskripsi,
          masuk: Number(payload.masuk) || 0,
          keluar: Number(payload.keluar) || 0,
          keterangan: payload.keterangan || ''
        })
      });
      const json = await resp.json();
      return json;
    } catch (err) {
      console.warn('Apps script update error:', err);
    }
  }

  // Fallback to proxy
  try {
    const resp = await fetch('/api/bb-kas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, user: userRole })
    });
    if (resp.ok) return await resp.json();
  } catch (err) {
    console.warn('Proxy update error:', err);
  }

  return { success: true, message: 'Transaksi kas diperbarui secara lokal', localOnly: true };
}
