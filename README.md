# BukuKas — Sistem Pembukuan & Keuangan (React + Google Sheets)

Sistem pembukuan web responsif berbasis **React + Tailwind CSS** dengan **Google Sheets** sebagai *single source of truth*.

- **Spreadsheet Target:** [Google Sheets Keuangan](https://docs.google.com/spreadsheets/d/1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao/edit?usp=sharing)
- **Spreadsheet ID:** `1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao`
- **Font Utama:** Poppins & JetBrains Mono (tabular numerals)

---

## Modul & Struktur Tab

1. **Dashboard:** Ringkasan KPI saldo berjalan, total pemasukan, total pengeluaran, progress iuran anggota, dan transaksi kas terkini.
2. **Kartu Iuran:** Tabel matriks setoran bulanan tiap anggota, pendapatan lain-lain, dan drawer detail transaksi.
3. **RAB Harian:** Tabel anggaran kebutuhan operasional (Konsumsi, Posko, Transportasi, Langganan, Sekre) dengan rumus otomatis `Volume × Harga Satuan`.
4. **RAB Proker:** 9 blok program kerja terencana dan insidental.
5. **Buku Kas:** Arus kas harian debit & kredit dengan kalkulasi saldo berjalan otomatis (`Saldo Sebelumnya + Masuk - Keluar`).
6. **Lain-Lain:** Pengelolaan seragam vest & foto studio.
7. **Unduh Excel (.xlsx):** Tombol ekspor langsung dari Google Sheets live.
8. **Log Audit:** Riwayat pencatatan setiap aksi mutasi.

---

## Konfigurasi Lingkungan (.env)

Pengaturan Apps Script dikonfigurasi langsung via environment variables:

```bash
# File .env atau Environment Variables di Vercel:
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
GOOGLE_SPREADSHEET_ID=1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao
```

---

## Pemasangan Google Apps Script

1. Buka [Google Sheets](https://docs.google.com/spreadsheets/d/1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao/edit?usp=sharing).
2. Menu **Ekstensi** > **Apps Script**.
3. Salin isi [`google-apps-script/Code.gs`](google-apps-script/Code.gs) ke editor Apps Script.
4. Simpan (`Ctrl + S`), klik **Deploy** > **New deployment**.
5. Pilih **Web app**:
   - *Execute as:* `Me`
   - *Who has access:* `Anyone`
6. Salin URL Web App (`.../exec`) dan masukkan ke variabel `VITE_APPS_SCRIPT_URL` di `.env` atau Vercel Settings.

---

## Deployment ke Vercel

1. Push repository ke GitHub / GitLab:
   ```bash
   git add .
   git commit -m "feat: perbarui UI/UX anti ai-slop dan konfigurasi env"
   git push origin main
   ```
2. Di Vercel Dashboard, klik **Add New Project** > pilih repository ini.
3. Tambahkan environment variable `VITE_APPS_SCRIPT_URL` (URL Web App Apps Script).
4. Klik **Deploy**. Selesai.
