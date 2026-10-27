import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Path to initial data seed
const initialDataPath = path.join(__dirname, 'data', 'initialData.json');
let cachedData = null;
let auditLogs = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    user: 'System',
    action: 'Inisialisasi',
    sheet: 'ALL',
    details: 'Sistem Keuangan KKN siap digunakan dengan data live Google Sheets.'
  }
];

function loadLocalData() {
  if (!cachedData) {
    if (fs.existsSync(initialDataPath)) {
      const raw = fs.readFileSync(initialDataPath, 'utf-8');
      cachedData = JSON.parse(raw);
    }
  }
  return cachedData;
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    appsScriptConfigured: Boolean(APPS_SCRIPT_URL),
    mode: APPS_SCRIPT_URL ? 'live-apps-script' : 'live-public-export'
  });
});

// Status
app.get('/api/status', async (req, res) => {
  res.json({
    status: 'connected',
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    sheets: ['KARTU IURAN', 'RAB HARIAN', 'RAB PROKER', 'BB KAS', 'LAIN LAIN'],
    appsScriptConfigured: Boolean(APPS_SCRIPT_URL),
    lastSync: new Date().toISOString()
  });
});

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    // If APPS_SCRIPT_URL is provided, attempt to fetch live from Google Apps Script
    if (APPS_SCRIPT_URL) {
      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getAll`);
        if (response.ok) {
          const json = await response.json();
          if (json && json.data) {
            cachedData = json.data;
            return res.json({ source: 'apps-script', data: json.data });
          }
        }
      } catch (scriptErr) {
        console.warn('Apps script fetch error, fallback to local cache:', scriptErr.message);
      }
    }

    const data = loadLocalData();
    res.json({ source: 'local-seed', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export XLSX directly from Google Sheets live
app.get('/api/export', (req, res) => {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
  res.redirect(exportUrl);
});

// Audit logs
app.get('/api/audit', (req, res) => {
  res.json({ logs: auditLogs });
});

// Write endpoints (support forwarding to Apps Script or in-memory update)
app.post('/api/iuran', async (req, res) => {
  const { member, month, tanggal, nominal, metode, user } = req.body;
  if (!member || !month || !nominal) {
    return res.status(400).json({ error: 'Data iuran tidak lengkap (member, month, nominal wajib diisi)' });
  }

  auditLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    user: user || 'Bendahara',
    action: 'TAMBAH_IURAN',
    sheet: 'KARTU IURAN',
    details: `${member} - ${month}: Rp ${Number(nominal).toLocaleString('id-ID')} (${metode || 'Cash'})`
  });

  if (APPS_SCRIPT_URL) {
    try {
      const resp = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addIuran', member, month, tanggal, nominal, metode })
      });
      const result = await resp.json();
      return res.json(result);
    } catch (err) {
      console.warn('Forwarding to Apps Script failed:', err.message);
    }
  }

  // Local state update fallback
  const data = loadLocalData();
  const mem = data.kartuIuran.members.find(m => m.name.toUpperCase() === member.toUpperCase());
  if (mem && mem.months[month]) {
    const entries = mem.months[month].entries;
    if (entries.length >= 5) {
      return res.status(400).json({ error: `Slot iuran untuk ${member} bulan ${month} sudah penuh (maks 5 transaksi)` });
    }
    entries.push({
      slot: entries.length + 1,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      nominal: Number(nominal),
      metode: metode || 'Cash'
    });
    mem.months[month].subtotal += Number(nominal);
    mem.total += Number(nominal);
    data.kartuIuran.totalDanaKelompok += Number(nominal);
    data.kartuIuran.totalBersih += Number(nominal);
  }

  res.json({ success: true, message: 'Iuran berhasil dicatat', localOnly: !APPS_SCRIPT_URL });
});

// Add BB KAS transaction
app.post('/api/bb-kas', async (req, res) => {
  const { bulan, tanggal, deskripsi, tipe, nominal, keterangan, user } = req.body;
  if (!deskripsi || !nominal) {
    return res.status(400).json({ error: 'Deskripsi dan nominal wajib diisi' });
  }

  const numNominal = Number(nominal);
  auditLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    user: user || 'Bendahara',
    action: 'TAMBAH_KAS',
    sheet: 'BB KAS',
    details: `${bulan || 'OKTOBER'} - ${deskripsi}: Rp ${numNominal.toLocaleString('id-ID')} (${tipe || 'Keluar'})`
  });

  if (APPS_SCRIPT_URL) {
    try {
      const resp = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addBbKasTransaction', bulan, tanggal, deskripsi, tipe, nominal: numNominal, keterangan })
      });
      const result = await resp.json();
      return res.json(result);
    } catch (err) {
      console.warn('Apps script post failed:', err.message);
    }
  }

  // Local state update
  const data = loadLocalData();
  const targetMonth = bulan || 'OKTOBER';
  const txList = data.bbKas[targetMonth] || [];
  const prevSaldo = txList.length > 0 ? txList[txList.length - 1].saldo : 17300000;
  const newSaldo = tipe === 'Masuk' ? prevSaldo + numNominal : prevSaldo - numNominal;

  const newTx = {
    row: txList.length + 8,
    bulanLabel: '',
    tanggal: Number(tanggal) || new Date().getDate(),
    deskripsi,
    masuk: tipe === 'Masuk' ? numNominal : 0,
    keluar: tipe === 'Keluar' ? numNominal : 0,
    saldo: newSaldo,
    keterangan: keterangan || ''
  };
  txList.push(newTx);

  res.json({ success: true, message: 'Transaksi kas berhasil dicatat', tx: newTx, localOnly: !APPS_SCRIPT_URL });
});

export default app;
