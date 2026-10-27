# BukuKas KKN — Sistem Keuangan KKN React & Google Sheets

> **Nama Proyek:** BukuKas KKN  
> **Unit KKN:** KKN M UNY 2026/2027 — Padukuhan Pengkol, Sriharjo  
> **Spreadsheet Sumber (Single Source of Truth):** [Google Sheets Keuangan KKN](https://docs.google.com/spreadsheets/d/1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao/edit?usp=sharing)  
> **Spreadsheet ID:** `1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao`  
> **Frontend:** React JS + Tailwind CSS (Vite)  
> **Backend/Integrasi:** Google Apps Script Web App + Node.js / Vercel Serverless  

---

## 📌 Ringkasan Proyek

BukuKas KKN adalah aplikasi web responsif modern bertema **ledger / buku kas klasik hijau hutan dan kertas gading** untuk mencatat, mengelola, dan memantau seluruh arus kas, iuran anggota, dan rencana anggaran belanja (RAB) KKN secara real-time.

Semua data tersinkronisasi langsung dengan Google Sheets tanpa merusak formula, struktur baris/kolom, atau merged cells yang sudah ada.

### Fitur Utama

1. **Dashboard Eksekutif**:
   - Saldo Kas Aktif Real-time (dari Buku Kas)
   - Total Dana Kelompok (Iuran 10 Anggota + Pendapatan Lain)
   - Total Realisasi Pengeluaran Kas
   - Monitoring Progres Iuran per Anggota (Target Rp 1.600.000 / orang)
   - 6 Transaksi Terkini Buku Kas
2. **KARTU IURAN**:
   - Form catat setoran iuran anggota (Sarah, Afria, Aura, Hervi, Yoga, Syifa, Nia, Lira, Rizaldi, Revaldo)
   - Pencatatan Pendapatan Lain-lain (Bank Jago, Seabank)
   - Mode Tampilan Kartu & Mode Tampilan Grid Asli (Replika Sheet)
   - Proteksi slot (maks 5 slot per bulan per anggota) dan formula read-only.
3. **RAB HARIAN**:
   - 5 Bagian Kebutuhan: Konsumsi, Posko/Kebersihan, Transportasi, Langganan, Sekre
   - Rumus otomatis: `Jumlah = Volume × Harga Satuan`
   - Edit inline bagi Bendahara tanpa merusak formula subtotal/total.
4. **RAB PROKER**:
   - 9 Blok Program Kerja (Proker Utama, Proker Penunjang, Proker Tambahan, Insidental)
   - Subtotal dan total anggaran proker.
5. **BB KAS (Buku Besar Kas)**:
   - Pencatatan transaksi harian Masuk (Debit) dan Keluar (Kredit)
   - Perhitungan Saldo Berjalan otomatis (`Saldo = Saldo Sblm + Masuk - Keluar`)
   - Filter per bulan (Oktober, November, Desember) dan tipe transaksi.
6. **LAIN LAIN**:
   - Status Seragam Vest 10 anggota
   - Biaya Foto Studio (Onomoto & Kuy Studio)
7. **Unduh Excel (.xlsx)**:
   - 1-Klik unduh snapshot `.xlsx` langsung dari Google Sheets.
8. **Role & Hak Akses**:
   - **Bendahara**: Menambah & mengubah data.
   - **Pembaca**: Mode pemantauan read-only.
9. **Log Audit**:
   - Mencatat setiap waktu penambahan/perubahan transaksi.

---

## 🚀 Cara Menghubungkan Google Sheets via Apps Script (Paling Mudah & Efektif)

Menggunakan Google Apps Script adalah metode paling efektif karena berjalan langsung di Google Sheets tanpa perlu kartu kredit / Google Cloud Service Account yang rumit:

1. Buka spreadsheet [Keuangan KKN](https://docs.google.com/spreadsheets/d/1LTrn9T9qN0WdpalnD_IvWrc2cGjNEuKP/edit).
2. Klik menu **Extensions (Ekstensi)** > **Apps Script**.
3. Buka file `google-apps-script/Code.gs` di repository ini, salin seluruh kodenya, dan paste ke editor Apps Script.
4. Klik icon **Save (Simpan)**.
5. Klik tombol biru **Deploy** di pojok kanan atas > **New deployment**.
6. Pilih jenis **Web app**.
   - **Description:** `BukuKas KKN API`
   - **Execute as:** `Me` (email Anda)
   - **Who has access:** `Anyone` (Siapa saja)
7. Klik **Deploy**, salin **Web app URL** yang berakhiran `/exec`.
8. Buka menu **Pengaturan & Script** di web BukuKas KKN, tempel URL tersebut, dan klik **Simpan URL**.
9. Selesai! Web Anda kini terhubung dua arah secara live ke Google Sheets.

---

## 🌐 Cara Deploy ke Vercel

Aplikasi ini sudah 100% siap dideploy ke Vercel:

1. Push folder proyek ini ke repository GitHub atau GitLab Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi BukuKas KKN React Google Sheets"
   git branch -M main
   git remote add origin <URL_REPO_ANDA>
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com) > **Add New Project**.
3. Pilih repository GitHub Anda.
4. (Opsional) Pada bagian **Environment Variables**, tambahkan:
   - `VITE_APPS_SCRIPT_URL`: URL Web App Apps Script Anda.
5. Klik **Deploy**.
6. Vercel akan otomatis menjalankan build sesuai `vercel.json` dan aplikasi siap diakses dari HP maupun laptop!

---

## 💻 Menjalankan di Komputer Lokal

```bash
# 1. Jalankan frontend development server
npm run dev:frontend

# Atau masuk ke direktori frontend:
cd frontend
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`.
