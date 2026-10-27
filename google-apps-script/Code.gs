/**
 * BukuKas KKN - Google Apps Script Backend
 * Spreadsheet ID: 1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets Keuangan KKN Anda:
 *    https://docs.google.com/spreadsheets/d/1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao/edit
 * 2. Klik menu 'Ekstensi' (Extensions) > 'Apps Script'.
 * 3. Hapus kode bawaan (myFunction) dan paste SELURUH isi file ini.
 * 4. Klik icon 'Save' (Simpan) / Ctrl+S.
 * 5. Klik tombol biru 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru).
 * 6. Klik ikon gerigi (Select type) > pilih 'Web app' (Aplikasi web).
 * 7. Isi Description: "BukuKas KKN API".
 * 8. Execute as: "Me" (email Anda).
 * 9. Who has access: "Anyone" (Siapa saja).
 * 10. Klik Deploy > Authorize access (Izinkan akses dengan akun Google Anda).
 * 11. Salin "Web app URL" (yang berakhiran /exec), lalu masukkan URL tersebut
 *     ke menu Pengaturan di aplikasi Web BukuKas KKN.
 */

const SPREADSHEET_ID = "1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao";

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function jsonResponse(data, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify({
    status: status === 200 ? 'success' : 'error',
    code: status,
    data: data,
    timestamp: new Date().toISOString()
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getAll';
  const ss = getSpreadsheet();

  try {
    if (action === 'status') {
      return jsonResponse({
        spreadsheetId: ss.getId(),
        name: ss.getName(),
        sheets: ss.getSheets().map(s => s.getName()),
        status: 'connected',
        lastUpdated: new Date().toISOString()
      });
    }

    if (action === 'exportXlsx') {
      return jsonResponse({
        downloadUrl: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx',
        filename: 'KEUANGAN_KKN_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmm') + '.xlsx'
      });
    }

    // Default action: getAll
    const data = readAllSheets(ss);
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ message: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const ss = getSpreadsheet();

    let result = { message: 'No action performed' };

    switch (action) {
      case 'addIuran':
        result = handleAddIuran(ss, payload);
        break;
      case 'addLainLainIuran':
        result = handleAddLainLainIuran(ss, payload);
        break;
      case 'addBbKasTransaction':
        result = handleAddBbKasTransaction(ss, payload);
        break;
      case 'updateRabHarianItem':
        result = handleUpdateRabHarianItem(ss, payload);
        break;
      case 'updateRabProkerItem':
        result = handleUpdateRabProkerItem(ss, payload);
        break;
      case 'updateVestItem':
        result = handleUpdateVestItem(ss, payload);
        break;
      case 'updateFotoStudioItem':
        result = handleUpdateFotoStudioItem(ss, payload);
        break;
      default:
        return jsonResponse({ message: 'Action tidak dikenal: ' + action }, 400);
    }

    // Kembalikan data terbaru setelah update
    const freshData = readAllSheets(ss);
    return jsonResponse({
      result: result,
      freshData: freshData
    });
  } catch (err) {
    return jsonResponse({ message: err.toString() }, 500);
  }
}

// ==========================================
// 1. READ ALL SHEETS
// ==========================================
function readAllSheets(ss) {
  return {
    kartuIuran: readKartuIuran(ss.getSheetByName('KARTU IURAN')),
    rabHarian: readRabHarian(ss.getSheetByName('RAB HARIAN')),
    rabProker: readRabProker(ss.getSheetByName('RAB PROKER')),
    bbKas: readBbKas(ss.getSheetByName('BB KAS')),
    lainLain: readLainLain(ss.getSheetByName('LAIN LAIN'))
  };
}

// KARTU IURAN
function readKartuIuran(sheet) {
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();

  const memberRows = [5, 16, 27, 38, 49, 60, 71, 82, 93, 104]; // 1-based index
  const monthsCols = [
    { name: 'FEBRUARI', c: 1 },
    { name: 'MARET', c: 5 },
    { name: 'APRIL', c: 9 },
    { name: 'MEI', c: 13 },
    { name: 'JUNI', c: 17 },
    { name: 'JULI', c: 21 },
    { name: 'AGUSTUS', c: 25 },
    { name: 'SEPTEMBER/OKTOBER', c: 29 }
  ];

  const members = [];
  for (let i = 0; i < memberRows.length; i++) {
    const rStart = memberRows[i]; // 1-based
    const rIdx = rStart - 1; // 0-based
    const name = values[rIdx][0];
    const memberObj = {
      name: name,
      months: {},
      total: values[rIdx + 8][32] || 0
    };

    for (let m = 0; m < monthsCols.length; m++) {
      const mInfo = monthsCols[m];
      const cIdx = mInfo.c - 1;
      const entries = [];
      for (let slot = 0; slot < 5; slot++) {
        const slotRowIdx = rIdx + 3 + slot;
        const tgl = formatDateVal(values[slotRowIdx][cIdx + 1]);
        const nom = values[slotRowIdx][cIdx + 2];
        const metode = values[slotRowIdx][cIdx + 3];
        if (tgl || nom || (metode && String(metode).trim())) {
          entries.append ? entries.push({
            slot: slot + 1,
            tanggal: tgl,
            nominal: Number(nom) || 0,
            metode: String(metode || '').trim()
          }) : entries.push({
            slot: slot + 1,
            tanggal: tgl,
            nominal: Number(nom) || 0,
            metode: String(metode || '').trim()
          });
        }
      }
      const subtotal = values[rIdx + 8][cIdx + 2] || 0;
      memberObj.months[mInfo.name] = {
        entries: entries,
        subtotal: Number(subtotal) || 0
      };
    }
    members.push(memberObj);
  }

  // Pendapatan Lain-Lain (row 115 1-based -> idx 114)
  const pendLain = {
    title: 'PENDAPATAN LAIN-LAIN',
    months: {},
    total: values[127][32] || 0
  };

  for (let m = 0; m < monthsCols.length; m++) {
    const mInfo = monthsCols[m];
    const cIdx = mInfo.c - 1;
    const entries = [];
    for (let slot = 0; slot < 10; slot++) {
      const slotRowIdx = 117 + slot; // row 118-127
      const tgl = formatDateVal(values[slotRowIdx][cIdx + 1]);
      const nom = values[slotRowIdx][cIdx + 2];
      const ket = values[slotRowIdx][cIdx + 3];
      if (tgl || nom || (ket && String(ket).trim())) {
        entries.push({
          slot: slot + 1,
          tanggal: tgl,
          nominal: Number(nom) || 0,
          keterangan: String(ket || '').trim()
        });
      }
    }
    const subtotal = values[127][cIdx + 2] || 0;
    pendLain.months[mInfo.name] = {
      entries: entries,
      subtotal: Number(subtotal) || 0
    };
  }

  return {
    members: members,
    pendapatanLain: pendLain,
    totalDanaKelompok: Number(values[129][32]) || 0,
    totalBersih: Number(values[129][34]) || 0,
    uangProker: Number(values[135][31]) || 0
  };
}

// RAB HARIAN
function readRabHarian(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();

  const categories = [
    { category: 'RAB KONSUMSI', colStart: 1 },
    { category: 'RAB POSKO/KEBERSIHAN', colStart: 8 },
    { category: 'RAB TRANSPORTASI', colStart: 15 },
    { category: 'RAB LANGGANAN', colStart: 22 },
    { category: 'RAB SEKRE', colStart: 29 }
  ];

  const result = [];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const cIdx = cat.colStart - 1;
    const items = [];
    for (let r = 5; r < 19; r++) { // rows 6 to 19 (0-indexed 5 to 18)
      const no = values[r][cIdx];
      const keb = values[r][cIdx + 1];
      const vol = values[r][cIdx + 2];
      const sat = values[r][cIdx + 3];
      const hrg = values[r][cIdx + 4];
      const jml = values[r][cIdx + 5];

      if (keb || vol || hrg || (jml !== '' && jml !== null && jml !== 0)) {
        items.push({
          row: r + 1,
          no: no,
          kebutuhan: String(keb || '').trim(),
          volume: vol === '' ? null : Number(vol),
          satuan: String(sat || '').trim(),
          harga: hrg === '' ? null : Number(hrg),
          jumlah: Number(jml) || 0
        });
      }
    }
    const total = values[19][cIdx + 5] || 0; // row 20
    result.push({
      category: cat.category,
      colStart: cat.colStart,
      items: items,
      total: Number(total) || 0
    });
  }
  return result;
}

// RAB PROKER
function readRabProker(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();

  const prokerBlocks = [
    { title: 'PENDATAAN MASYARAKAT', group: 'PROKER UTAMA', rStart: 6, rEnd: 19, cStart: 1, totalRow: 20 },
    { title: 'BIMBINGAN BELAJAR', group: 'PROKER PENUNJANG', rStart: 6, rEnd: 19, cStart: 8, totalRow: 20 },
    { title: 'PROKER TAMBAHAN', group: 'PROKER TAMBAHAN', rStart: 6, rEnd: 19, cStart: 15, totalRow: 20 },
    { title: 'PLANG EDUKATIF PADUKUHAN PENGKOL', group: 'PROKER UTAMA', rStart: 24, rEnd: 37, cStart: 1, totalRow: 38 },
    { title: 'TPA', group: 'PROKER PENUNJANG', rStart: 24, rEnd: 37, cStart: 8, totalRow: 38 },
    { title: 'PEMASANGAN KACA CEMBUUNG', group: 'PROKER UTAMA', rStart: 42, rEnd: 55, cStart: 1, totalRow: 56 },
    { title: 'JALAN SEHAT DAN POHON HARAPAN', group: 'PROKER UTAMA', rStart: 60, rEnd: 73, cStart: 1, totalRow: 74 },
    { title: 'PETA BENCANA', group: 'PROKER UTAMA', rStart: 78, rEnd: 91, cStart: 1, totalRow: 92 },
    { title: 'SISTEM PENGELOLAAN SAMPAH', group: 'PROKER UTAMA', rStart: 96, rEnd: 109, cStart: 1, totalRow: 110 }
  ];

  const result = [];
  for (let i = 0; i < prokerBlocks.length; i++) {
    const b = prokerBlocks[i];
    const cIdx = b.cStart - 1;
    const items = [];
    for (let r = b.rStart - 1; r < b.rEnd; r++) {
      const no = values[r][cIdx];
      const keb = values[r][cIdx + 1];
      const vol = values[r][cIdx + 2];
      const sat = values[r][cIdx + 3];
      const hrg = values[r][cIdx + 4];
      const jml = values[r][cIdx + 5];

      if (keb || vol || hrg || (jml !== '' && jml !== null && jml !== 0)) {
        items.push({
          row: r + 1,
          no: no,
          kebutuhan: String(keb || '').trim(),
          volume: vol === '' ? null : Number(vol),
          satuan: String(sat || '').trim(),
          harga: hrg === '' ? null : Number(hrg),
          jumlah: Number(jml) || 0
        });
      }
    }
    const tot = values[b.totalRow - 1][cIdx + 5] || 0;
    result.push({
      title: b.title,
      group: b.group,
      rowStart: b.rStart,
      colStart: b.cStart,
      items: items,
      total: Number(tot) || 0
    });
  }
  return result;
}

// BB KAS
function readBbKas(sheet) {
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();

  const monthsBb = [
    { name: 'OKTOBER', cStart: 1 },
    { name: 'NOVEMBER', cStart: 9 },
    { name: 'DESEMBER', cStart: 17 }
  ];

  const result = {};
  for (let i = 0; i < monthsBb.length; i++) {
    const m = monthsBb[i];
    const cIdx = m.cStart - 1;
    const txs = [];
    for (let r = 6; r < 71; r++) { // rows 7 to 71 (0-indexed 6 to 70)
      const blnLbl = values[r][cIdx];
      const tgl = values[r][cIdx + 1];
      const dsk = values[r][cIdx + 2];
      const msk = values[r][cIdx + 3];
      const klr = values[r][cIdx + 4];
      const sld = values[r][cIdx + 5];
      const ket = values[r][cIdx + 6];

      if (dsk || (msk !== '' && msk !== null && msk !== 0) || (klr !== '' && klr !== null && klr !== 0)) {
        txs.push({
          row: r + 1,
          bulanLabel: String(blnLbl || '').trim(),
          tanggal: tgl === '' ? null : Number(tgl),
          deskripsi: String(dsk || '').trim(),
          masuk: Number(msk) || 0,
          keluar: Number(klr) || 0,
          saldo: (typeof sld === 'number') ? sld : 0,
          keterangan: String(ket || '').trim()
        });
      }
    }
    result[m.name] = txs;
  }
  return result;
}

// LAIN LAIN
function readLainLain(sheet) {
  if (!sheet) return { vest: [], fotoStudio: [] };
  const values = sheet.getDataRange().getValues();

  const vestItems = [];
  for (let r = 2; r < 12; r++) { // rows 3 to 12
    vestItems.push({
      row: r + 1,
      no: values[r][1],
      nama: String(values[r][2] || '').trim(),
      ukuran: String(values[r][3] || '').trim(),
      harga: Number(values[r][4]) || 0,
      keterangan: String(values[r][5] || '').trim()
    });
  }

  const fotoItems = [];
  for (let r = 2; r < 12; r++) {
    fotoItems.push({
      row: r + 1,
      no: values[r][7],
      nama: String(values[r][8] || '').trim(),
      onomoto: Number(values[r][9]) || 0,
      kuyStudio: Number(values[r][10]) || 0,
      jumlah: Number(values[r][11]) || 0,
      keterangan: String(values[r][12] || '').trim()
    });
  }

  return {
    vest: vestItems,
    vestTotal: Number(values[12][4]) || 1270000,
    fotoStudio: fotoItems,
    fotoTotal: Number(values[12][11]) || 175000
  };
}

// ==========================================
// 2. WRITE HANDLERS (STRICT INPUT CELL MAP)
// ==========================================

function handleAddIuran(ss, p) {
  const sheet = ss.getSheetByName('KARTU IURAN');
  if (!sheet) throw new Error("Sheet 'KARTU IURAN' tidak ditemukan!");

  const memberName = String(p.member || '').trim().toUpperCase();
  const monthName = String(p.month || '').trim().toUpperCase();
  const tanggal = String(p.tanggal || '').trim();
  const nominal = Number(p.nominal) || 0;
  const metode = String(p.metode || '').trim();

  const memberRowMap = {
    'SARAH': 5, 'AFRIA': 16, 'AURA': 27, 'HERVI': 38, 'YOGA': 49,
    'SYIFA': 60, 'NIA': 71, 'LIRA': 82, 'RIZALDI': 93, 'REVALDO': 104
  };
  const monthColMap = {
    'FEBRUARI': 1, 'MARET': 5, 'APRIL': 9, 'MEI': 13,
    'JUNI': 17, 'JULI': 21, 'AGUSTUS': 25, 'SEPTEMBER': 29, 'SEPTEMBER/OKTOBER': 29, 'OKTOBER': 29
  };

  const rStart = memberRowMap[memberName];
  if (!rStart) throw new Error("Anggota tidak dikenal: " + memberName);
  const cStart = monthColMap[monthName];
  if (!cStart) throw new Error("Bulan tidak dikenal: " + monthName);

  // Cari slot kosong (1 s.d 5)
  let targetRow = null;
  for (let slot = 0; slot < 5; slot++) {
    const curRow = rStart + 3 + slot;
    const existingDate = sheet.getRange(curRow, cStart + 1).getValue();
    const existingNom = sheet.getRange(curRow, cStart + 2).getValue();
    if (!existingDate && !existingNom) {
      targetRow = curRow;
      break;
    }
  }

  if (!targetRow) {
    throw new Error("Kapasitas slot iuran untuk " + memberName + " bulan " + monthName + " sudah penuh (maks 5 transaksi)!");
  }

  // Tulis HANYA ke kolom Tanggal, Nominal, Metode (TIDAK menyentuh baris Total/Formula)
  sheet.getRange(targetRow, cStart + 1).setValue(tanggal);
  sheet.getRange(targetRow, cStart + 2).setValue(nominal);
  sheet.getRange(targetRow, cStart + 3).setValue(metode);

  return {
    success: true,
    message: "Iuran " + memberName + " sebesar Rp " + nominal + " berhasil dicatat pada baris " + targetRow,
    targetRow: targetRow
  };
}

function handleAddLainLainIuran(ss, p) {
  const sheet = ss.getSheetByName('KARTU IURAN');
  if (!sheet) throw new Error("Sheet 'KARTU IURAN' tidak ditemukan!");

  const monthName = String(p.month || 'SEPTEMBER/OKTOBER').trim().toUpperCase();
  const tanggal = String(p.tanggal || '').trim();
  const nominal = Number(p.nominal) || 0;
  const keterangan = String(p.keterangan || '').trim();

  const monthColMap = {
    'FEBRUARI': 1, 'MARET': 5, 'APRIL': 9, 'MEI': 13,
    'JUNI': 17, 'JULI': 21, 'AGUSTUS': 25, 'SEPTEMBER': 29, 'SEPTEMBER/OKTOBER': 29, 'OKTOBER': 29
  };
  const cStart = monthColMap[monthName] || 29;

  let targetRow = null;
  for (let slot = 0; slot < 10; slot++) {
    const curRow = 118 + slot;
    const existingDate = sheet.getRange(curRow, cStart + 1).getValue();
    const existingNom = sheet.getRange(curRow, cStart + 2).getValue();
    if (!existingDate && !existingNom) {
      targetRow = curRow;
      break;
    }
  }

  if (!targetRow) {
    throw new Error("Slot pendapatan lain-lain untuk bulan " + monthName + " sudah penuh (maks 10 slot)!");
  }

  sheet.getRange(targetRow, cStart + 1).setValue(tanggal);
  sheet.getRange(targetRow, cStart + 2).setValue(nominal);
  sheet.getRange(targetRow, cStart + 3).setValue(keterangan);

  return {
    success: true,
    message: "Pendapatan lain-lain sebesar Rp " + nominal + " berhasil dicatat.",
    targetRow: targetRow
  };
}

function handleAddBbKasTransaction(ss, p) {
  const sheet = ss.getSheetByName('BB KAS');
  if (!sheet) throw new Error("Sheet 'BB KAS' tidak ditemukan!");

  const bulan = String(p.bulan || 'OKTOBER').trim().toUpperCase();
  const tanggal = Number(p.tanggal) || new Date().getDate();
  const deskripsi = String(p.deskripsi || '').trim();
  const tipe = String(p.tipe || 'Keluar').trim(); // 'Masuk' atau 'Keluar'
  const nominal = Number(p.nominal) || 0;
  const keterangan = String(p.keterangan || '').trim();

  const monthColMap = {
    'OKTOBER': 1,
    'NOVEMBER': 9,
    'DESEMBER': 17
  };
  const cStart = monthColMap[bulan];
  if (!cStart) throw new Error("Bulan buku kas tidak valid: " + bulan);

  // Cari baris kosong di rows 8 s.d 71
  let targetRow = null;
  for (let r = 8; r <= 71; r++) {
    const dsk = sheet.getRange(r, cStart + 2).getValue();
    const msk = sheet.getRange(r, cStart + 3).getValue();
    const klr = sheet.getRange(r, cStart + 4).getValue();
    if (!dsk && !msk && !klr) {
      targetRow = r;
      break;
    }
  }

  if (!targetRow) {
    throw new Error("Buku kas bulan " + bulan + " sudah penuh (maks 71 baris)!");
  }

  // Tulis ke sel input yang diizinkan
  sheet.getRange(targetRow, cStart + 1).setValue(tanggal);
  sheet.getRange(targetRow, cStart + 2).setValue(deskripsi);

  if (tipe === 'Masuk') {
    sheet.getRange(targetRow, cStart + 3).setValue(nominal);
    sheet.getRange(targetRow, cStart + 4).setValue(0);
  } else {
    sheet.getRange(targetRow, cStart + 3).setValue(0);
    sheet.getRange(targetRow, cStart + 4).setValue(nominal);
  }

  sheet.getRange(targetRow, cStart + 6).setValue(keterangan);

  // Pastikan rumus saldo baris ini konsisten: Saldo Sebelum + Masuk - Keluar
  const saldoColLetter = cStart === 1 ? 'F' : (cStart === 9 ? 'N' : 'V');
  const masukColLetter = cStart === 1 ? 'D' : (cStart === 9 ? 'L' : 'T');
  const keluarColLetter = cStart === 1 ? 'E' : (cStart === 9 ? 'M' : 'U');
  const prevRow = targetRow - 1;
  const saldoCell = sheet.getRange(targetRow, cStart + 5);

  // Jika belum ada formula atau formula error, pulihkan rumus saldo
  const currentFormula = saldoCell.getFormula();
  if (!currentFormula || currentFormula.indexOf('#REF!') !== -1) {
    saldoCell.setFormula('=' + saldoColLetter + prevRow + '+' + masukColLetter + targetRow + '-' + keluarColLetter + targetRow);
  }

  return {
    success: true,
    message: "Transaksi '" + deskripsi + "' Rp " + nominal + " (" + tipe + ") berhasil dicatat pada baris " + targetRow,
    targetRow: targetRow
  };
}

function handleUpdateRabHarianItem(ss, p) {
  const sheet = ss.getSheetByName('RAB HARIAN');
  if (!sheet) throw new Error("Sheet 'RAB HARIAN' tidak ditemukan!");

  const row = Number(p.row);
  const colStart = Number(p.colStart);
  if (!row || !colStart || row < 6 || row > 19) {
    throw new Error("Koordinat item RAB Harian tidak valid!");
  }

  if (p.kebutuhan !== undefined) sheet.getRange(row, colStart + 1).setValue(p.kebutuhan);
  if (p.volume !== undefined) sheet.getRange(row, colStart + 2).setValue(p.volume);
  if (p.satuan !== undefined) sheet.getRange(row, colStart + 3).setValue(p.satuan);
  if (p.harga !== undefined) sheet.getRange(row, colStart + 4).setValue(p.harga);

  // Pastikan formula Jumlah (=Volume * Harga) tetap utuh
  const volColLetter = String.fromCharCode(64 + colStart + 2);
  const hrgColLetter = String.fromCharCode(64 + colStart + 4);
  const jmlRange = sheet.getRange(row, colStart + 5);
  if (!jmlRange.getFormula()) {
    jmlRange.setFormula('=' + volColLetter + row + '*' + hrgColLetter + row);
  }

  return { success: true, message: "Item RAB Harian baris " + row + " berhasil diperbarui." };
}

function handleUpdateRabProkerItem(ss, p) {
  const sheet = ss.getSheetByName('RAB PROKER');
  if (!sheet) throw new Error("Sheet 'RAB PROKER' tidak ditemukan!");

  const row = Number(p.row);
  const colStart = Number(p.colStart);
  if (!row || !colStart) {
    throw new Error("Koordinat item RAB Proker tidak valid!");
  }

  if (p.kebutuhan !== undefined) sheet.getRange(row, colStart + 1).setValue(p.kebutuhan);
  if (p.volume !== undefined) sheet.getRange(row, colStart + 2).setValue(p.volume);
  if (p.satuan !== undefined) sheet.getRange(row, colStart + 3).setValue(p.satuan);
  if (p.harga !== undefined) sheet.getRange(row, colStart + 4).setValue(p.harga);

  return { success: true, message: "Item RAB Proker baris " + row + " berhasil diperbarui." };
}

function handleUpdateVestItem(ss, p) {
  const sheet = ss.getSheetByName('LAIN LAIN');
  if (!sheet) throw new Error("Sheet 'LAIN LAIN' tidak ditemukan!");

  const row = Number(p.row);
  if (!row || row < 3 || row > 12) throw new Error("Baris Vest tidak valid!");

  if (p.ukuran !== undefined) sheet.getRange(row, 4).setValue(p.ukuran);
  if (p.keterangan !== undefined) sheet.getRange(row, 6).setValue(p.keterangan);

  return { success: true, message: "Data Vest baris " + row + " berhasil diperbarui." };
}

function handleUpdateFotoStudioItem(ss, p) {
  const sheet = ss.getSheetByName('LAIN LAIN');
  if (!sheet) throw new Error("Sheet 'LAIN LAIN' tidak ditemukan!");

  const row = Number(p.row);
  if (!row || row < 3 || row > 12) throw new Error("Baris Foto Studio tidak valid!");

  if (p.onomoto !== undefined) sheet.getRange(row, 10).setValue(p.onomoto);
  if (p.kuyStudio !== undefined) sheet.getRange(row, 11).setValue(p.kuyStudio);
  if (p.keterangan !== undefined) sheet.getRange(row, 13).setValue(p.keterangan);

  return { success: true, message: "Data Foto Studio baris " + row + " berhasil diperbarui." };
}

// ==========================================
// UTILS
// ==========================================
function formatDateVal(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'GMT+7', 'yyyy-MM-dd');
  }
  return String(val).trim();
}
