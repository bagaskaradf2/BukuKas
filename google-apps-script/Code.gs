/**
 * BukuKas - Google Apps Script Backend
 * Spreadsheet ID: 1We1fNStv2OeVgItursLI0pDYmLjVqZ3PfrBnyx2jaao
 * 
 * Sistem Terintegrasi 2 Arah Realtime:
 * - Sekali input langsung terhubung ke Buku Kas, RAB Harian/Proker, atau Kartu Iuran
 * - Rumus dan struktur Google Sheets tetap terjaga utuh
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
        filename: 'KEUANGAN_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmm') + '.xlsx'
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
      case 'recordIntegratedTransaction':
        result = handleIntegratedTransaction(ss, payload);
        break;
      case 'addRabHarianItem':
        result = handleAddRabHarianItem(ss, payload);
        break;
      case 'addIuran':
        result = handleAddIuran(ss, payload);
        break;
      case 'addBbKasTransaction':
        result = handleAddBbKasTransaction(ss, payload);
        break;
      case 'updateBbKasTransaction':
        result = handleUpdateBbKasTransaction(ss, payload);
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

    // Langsung baca kembali data segar agar realtime 2 arah
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
// 1. INTEGRATED TRANSACTION (SEKALI INPUT SEMUA TERHUBUNG)
// ==========================================
function handleIntegratedTransaction(ss, p) {
  const jenis = p.jenis; // 'Pengeluaran' atau 'Pemasukan'
  const tanggal = p.tanggal || new Date().toISOString().split('T')[0];
  const tglObj = new Date(tanggal);
  const tglDay = tglObj.getDate();
  const nominal = Number(p.nominal) || 0;
  const deskripsi = String(p.deskripsi || '').trim();
  const targetAlokasi = p.targetAlokasi; // 'RAB_KONSUMSI', 'RAB_POSKO', 'PROKER_...', 'IURAN_ANGGOTA', 'LAINNYA'

  // 1. Tulis ke BUKU KAS (BB KAS)
  const bulanNama = getBulanKas(tglObj.getMonth());
  const bbResult = handleAddBbKasTransaction(ss, {
    bulan: bulanNama,
    tanggal: tglDay,
    deskripsi: deskripsi,
    tipe: jenis === 'Pemasukan' ? 'Masuk' : 'Keluar',
    nominal: nominal,
    keterangan: p.keterangan || (targetAlokasi ? targetAlokasi.replace('RAB_', '') : 'Kas')
  });

  // 2. Hubungkan ke RAB atau Kartu Iuran secara otomatis
  if (jenis === 'Pengeluaran') {
    if (targetAlokasi && targetAlokasi.startsWith('RAB_')) {
      const catName = targetAlokasi.replace('RAB_', 'RAB ');
      handleAddRabHarianItem(ss, {
        category: catName,
        kebutuhan: deskripsi,
        volume: Number(p.volume) || 1,
        satuan: p.satuan || 'Kali',
        harga: Number(p.harga) || nominal
      });
    } else if (targetAlokasi && targetAlokasi.startsWith('PROKER_')) {
      const prokerTitle = targetAlokasi.replace('PROKER_', '');
      handleAddRabProkerItem(ss, {
        title: prokerTitle,
        kebutuhan: deskripsi,
        volume: Number(p.volume) || 1,
        satuan: p.satuan || 'Unit',
        harga: Number(p.harga) || nominal
      });
    }
  } else if (jenis === 'Pemasukan') {
    if (p.member) {
      handleAddIuran(ss, {
        member: p.member,
        month: p.bulanIuran || 'SEPTEMBER/OKTOBER',
        tanggal: tanggal,
        nominal: nominal,
        metode: p.metode || 'Transfer'
      });
    } else {
      handleAddLainLainIuran(ss, {
        month: p.bulanIuran || 'SEPTEMBER/OKTOBER',
        tanggal: tanggal,
        nominal: nominal,
        keterangan: deskripsi
      });
    }
  }

  return {
    success: true,
    message: "Transaksi '" + deskripsi + "' Rp " + nominal + " berhasil terintegrasi ke Buku Kas dan target anggaran.",
    bbResult: bbResult
  };
}

function getBulanKas(monthIdx) {
  if (monthIdx <= 9) return 'OKTOBER';
  if (monthIdx === 10) return 'NOVEMBER';
  return 'DESEMBER';
}

// Tambah item kebutuhan baru di RAB Harian
function handleAddRabHarianItem(ss, p) {
  const sheet = ss.getSheetByName('RAB HARIAN');
  if (!sheet) return;

  const catMap = {
    'RAB KONSUMSI': 1,
    'RAB POSKO/KEBERSIHAN': 8,
    'RAB TRANSPORTASI': 15,
    'RAB LANGGANAN': 22,
    'RAB SEKRE': 29
  };
  const cStart = catMap[p.category] || 1;

  // Cari baris kosong di rows 6 s.d 19
  let targetRow = null;
  let nextNo = 1;
  for (let r = 6; r <= 19; r++) {
    const keb = sheet.getRange(r, cStart + 1).getValue();
    const curNo = sheet.getRange(r, cStart).getValue();
    if (curNo && typeof curNo === 'number') nextNo = curNo + 1;
    if (!keb) {
      targetRow = r;
      break;
    }
  }

  if (targetRow) {
    sheet.getRange(targetRow, cStart).setValue(nextNo);
    sheet.getRange(targetRow, cStart + 1).setValue(p.kebutuhan);
    sheet.getRange(targetRow, cStart + 2).setValue(p.volume || 1);
    sheet.getRange(targetRow, cStart + 3).setValue(p.satuan || 'Kali');
    sheet.getRange(targetRow, cStart + 4).setValue(p.harga || 0);

    const volCol = String.fromCharCode(64 + cStart + 2);
    const hrgCol = String.fromCharCode(64 + cStart + 4);
    sheet.getRange(targetRow, cStart + 5).setFormula('=' + volCol + targetRow + '*' + hrgCol + targetRow);
  }

  return { success: true, row: targetRow };
}

// Tambah item di RAB Proker
function handleAddRabProkerItem(ss, p) {
  const sheet = ss.getSheetByName('RAB PROKER');
  if (!sheet) return;

  const prokerBlocks = [
    { title: 'PENDATAAN MASYARAKAT', rStart: 6, rEnd: 19, cStart: 1 },
    { title: 'BIMBINGAN BELAJAR', rStart: 6, rEnd: 19, cStart: 8 },
    { title: 'PROKER TAMBAHAN', rStart: 6, rEnd: 19, cStart: 15 },
    { title: 'PLANG EDUKATIF PADUKUHAN PENGKOL', rStart: 24, rEnd: 37, cStart: 1 },
    { title: 'TPA', rStart: 24, rEnd: 37, cStart: 8 },
    { title: 'PEMASANGAN KACA CEMBUUNG', rStart: 42, rEnd: 55, cStart: 1 },
    { title: 'JALAN SEHAT DAN POHON HARAPAN', rStart: 60, rEnd: 73, cStart: 1 },
    { title: 'PETA BENCANA', rStart: 78, rEnd: 91, cStart: 1 },
    { title: 'SISTEM PENGELOLAAN SAMPAH', rStart: 96, rEnd: 109, cStart: 1 }
  ];

  const blk = prokerBlocks.find(b => b.title === p.title) || prokerBlocks[0];
  let targetRow = null;
  let nextNo = 1;

  for (let r = blk.rStart; r <= blk.rEnd; r++) {
    const keb = sheet.getRange(r, blk.cStart + 1).getValue();
    const curNo = sheet.getRange(r, blk.cStart).getValue();
    if (curNo && typeof curNo === 'number') nextNo = curNo + 1;
    if (!keb) {
      targetRow = r;
      break;
    }
  }

  if (targetRow) {
    sheet.getRange(targetRow, blk.cStart).setValue(nextNo);
    sheet.getRange(targetRow, blk.cStart + 1).setValue(p.kebutuhan);
    sheet.getRange(targetRow, blk.cStart + 2).setValue(p.volume || 1);
    sheet.getRange(targetRow, blk.cStart + 3).setValue(p.satuan || 'Unit');
    sheet.getRange(targetRow, blk.cStart + 4).setValue(p.harga || 0);

    const volCol = String.fromCharCode(64 + blk.cStart + 2);
    const hrgCol = String.fromCharCode(64 + blk.cStart + 4);
    sheet.getRange(targetRow, blk.cStart + 5).setFormula('=' + volCol + targetRow + '*' + hrgCol + targetRow);
  }

  return { success: true, row: targetRow };
}

// ==========================================
// 2. READ ALL SHEETS
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

function readKartuIuran(sheet) {
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();

  const memberRows = [5, 16, 27, 38, 49, 60, 71, 82, 93, 104];
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
    const rStart = memberRows[i];
    const rIdx = rStart - 1;
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
          entries.push({
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
      const slotRowIdx = 117 + slot;
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
    for (let r = 5; r < 24; r++) {
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
    const calculatedTotal = items.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0);
    const total = calculatedTotal > 0 ? calculatedTotal : (Number(values[24] && values[24][cIdx + 5]) || 0);
    result.push({
      category: cat.category,
      colStart: cat.colStart,
      items: items,
      total: Number(total) || 0
    });
  }
  return result;
}

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
    const calculatedTotal = items.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0);
    const tot = calculatedTotal > 0 ? calculatedTotal : (Number(values[b.totalRow - 1] && values[b.totalRow - 1][cIdx + 5]) || 0);
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
    let lastTanggal = null;
    for (let r = 6; r < 71; r++) {
      const blnLbl = values[r][cIdx];
      const rawTgl = values[r][cIdx + 1];
      const dsk = values[r][cIdx + 2];
      const msk = values[r][cIdx + 3];
      const klr = values[r][cIdx + 4];
      const sld = values[r][cIdx + 5];
      const ket = values[r][cIdx + 6];

      if (dsk || (msk !== '' && msk !== null && msk !== 0) || (klr !== '' && klr !== null && klr !== 0)) {
        let tgl = null;
        if (rawTgl !== '' && rawTgl !== null && !isNaN(rawTgl) && rawTgl !== '-') {
          tgl = Number(rawTgl);
          lastTanggal = tgl;
        } else if (lastTanggal !== null) {
          tgl = lastTanggal; // Wariskan tanggal dari baris sebelumnya jika kosong atau tanda strip (-)
        }

        txs.push({
          row: r + 1,
          bulanLabel: String(blnLbl || '').trim(),
          tanggal: tgl,
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

function readLainLain(sheet) {
  if (!sheet) return { vest: [], fotoStudio: [] };
  const values = sheet.getDataRange().getValues();

  const vestItems = [];
  for (let r = 2; r < 12; r++) {
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
// 3. LOW LEVEL WRITES
// ==========================================
function handleAddIuran(ss, p) {
  const sheet = ss.getSheetByName('KARTU IURAN');
  if (!sheet) return;

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
    'JUNI': 17, 'JULI': 21, 'AGUSTUS': 25,
    'SEPTEMBER': 29, 'SEPTEMBER/OKTOBER': 29, 'OKTOBER': 29,
    'NOVEMBER': 29, 'DESEMBER': 29, 'NOVEMBER/DESEMBER': 29
  };

  const rStart = memberRowMap[memberName];
  const cStart = monthColMap[monthName] || 29;
  if (!rStart) return;

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

  if (targetRow) {
    sheet.getRange(targetRow, cStart + 1).setValue(tanggal);
    sheet.getRange(targetRow, cStart + 2).setValue(nominal);
    sheet.getRange(targetRow, cStart + 3).setValue(metode);
  }
}

function handleAddLainLainIuran(ss, p) {
  const sheet = ss.getSheetByName('KARTU IURAN');
  if (!sheet) return;

  const monthName = String(p.month || 'SEPTEMBER/OKTOBER').trim().toUpperCase();
  const tanggal = String(p.tanggal || '').trim();
  const nominal = Number(p.nominal) || 0;
  const keterangan = String(p.keterangan || '').trim();

  const monthColMap = {
    'FEBRUARI': 1, 'MARET': 5, 'APRIL': 9, 'MEI': 13,
    'JUNI': 17, 'JULI': 21, 'AGUSTUS': 25,
    'SEPTEMBER': 29, 'SEPTEMBER/OKTOBER': 29, 'OKTOBER': 29,
    'NOVEMBER': 29, 'DESEMBER': 29, 'NOVEMBER/DESEMBER': 29
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

  if (targetRow) {
    sheet.getRange(targetRow, cStart + 1).setValue(tanggal);
    sheet.getRange(targetRow, cStart + 2).setValue(nominal);
    sheet.getRange(targetRow, cStart + 3).setValue(keterangan);
  }
}

function handleAddBbKasTransaction(ss, p) {
  const sheet = ss.getSheetByName('BB KAS');
  if (!sheet) return;

  const bulan = String(p.bulan || 'OKTOBER').trim().toUpperCase();
  const tanggal = Number(p.tanggal) || new Date().getDate();
  const deskripsi = String(p.deskripsi || '').trim();
  const tipe = String(p.tipe || 'Keluar').trim();
  const nominal = Number(p.nominal) || 0;
  const keterangan = String(p.keterangan || '').trim();

  const monthColMap = {
    'OKTOBER': 1,
    'NOVEMBER': 9,
    'DESEMBER': 17
  };
  const cStart = monthColMap[bulan] || 1;

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

  if (!targetRow) return { error: "Buku kas penuh" };

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

  const saldoColLetter = cStart === 1 ? 'F' : (cStart === 9 ? 'N' : 'V');
  const masukColLetter = cStart === 1 ? 'D' : (cStart === 9 ? 'L' : 'T');
  const keluarColLetter = cStart === 1 ? 'E' : (cStart === 9 ? 'M' : 'U');
  const prevRow = targetRow - 1;
  const saldoCell = sheet.getRange(targetRow, cStart + 5);

  const currentFormula = saldoCell.getFormula();
  if (!currentFormula || currentFormula.indexOf('#REF!') !== -1) {
    saldoCell.setFormula('=' + saldoColLetter + prevRow + '+' + masukColLetter + targetRow + '-' + keluarColLetter + targetRow);
  }

  return { success: true, row: targetRow };
}

function handleUpdateBbKasTransaction(ss, p) {
  const sheet = ss.getSheetByName('BB KAS');
  if (!sheet) return { error: "Sheet BB KAS tidak ditemukan" };

  const bulan = String(p.bulan || 'OKTOBER').trim().toUpperCase();
  const row = Number(p.row);
  if (!row) return { error: "Row tidak valid" };

  const monthColMap = {
    'OKTOBER': 1,
    'NOVEMBER': 9,
    'DESEMBER': 17
  };
  const cStart = monthColMap[bulan] || 1;

  if (p.tanggal !== undefined && p.tanggal !== null) {
    sheet.getRange(row, cStart + 1).setValue(p.tanggal);
  }
  if (p.deskripsi !== undefined) {
    sheet.getRange(row, cStart + 2).setValue(String(p.deskripsi).trim());
  }
  if (p.masuk !== undefined) {
    sheet.getRange(row, cStart + 3).setValue(Number(p.masuk) || 0);
  }
  if (p.keluar !== undefined) {
    sheet.getRange(row, cStart + 4).setValue(Number(p.keluar) || 0);
  }
  if (p.keterangan !== undefined) {
    sheet.getRange(row, cStart + 6).setValue(String(p.keterangan).trim());
  }

  // Jaga rumus saldo di kolom F (Okt), N (Nov), atau V (Des)
  const saldoColLetter = cStart === 1 ? 'F' : (cStart === 9 ? 'N' : 'V');
  const masukColLetter = cStart === 1 ? 'D' : (cStart === 9 ? 'L' : 'T');
  const keluarColLetter = cStart === 1 ? 'E' : (cStart === 9 ? 'M' : 'U');
  const prevRow = row - 1;
  const saldoCell = sheet.getRange(row, cStart + 5);
  const currentFormula = saldoCell.getFormula();
  if (!currentFormula || currentFormula.indexOf('#REF!') !== -1) {
    saldoCell.setFormula('=' + saldoColLetter + prevRow + '+' + masukColLetter + row + '-' + keluarColLetter + row);
  }

  return { success: true, row: row };
}

function handleUpdateRabHarianItem(ss, p) {
  const sheet = ss.getSheetByName('RAB HARIAN');
  if (!sheet) return;

  const row = Number(p.row);
  const colStart = Number(p.colStart);
  if (!row || !colStart) return;

  if (p.kebutuhan !== undefined) sheet.getRange(row, colStart + 1).setValue(p.kebutuhan);
  if (p.volume !== undefined) sheet.getRange(row, colStart + 2).setValue(p.volume);
  if (p.satuan !== undefined) sheet.getRange(row, colStart + 3).setValue(p.satuan);
  if (p.harga !== undefined) sheet.getRange(row, colStart + 4).setValue(p.harga);

  const volColLetter = String.fromCharCode(64 + colStart + 2);
  const hrgColLetter = String.fromCharCode(64 + colStart + 4);
  const jmlRange = sheet.getRange(row, colStart + 5);
  if (!jmlRange.getFormula()) {
    jmlRange.setFormula('=' + volColLetter + row + '*' + hrgColLetter + row);
  }
}

function handleUpdateRabProkerItem(ss, p) {
  const sheet = ss.getSheetByName('RAB PROKER');
  if (!sheet) return;

  const row = Number(p.row);
  const colStart = Number(p.colStart);
  if (!row || !colStart) return;

  if (p.kebutuhan !== undefined) sheet.getRange(row, colStart + 1).setValue(p.kebutuhan);
  if (p.volume !== undefined) sheet.getRange(row, colStart + 2).setValue(p.volume);
  if (p.satuan !== undefined) sheet.getRange(row, colStart + 3).setValue(p.satuan);
  if (p.harga !== undefined) sheet.getRange(row, colStart + 4).setValue(p.harga);
}

function handleUpdateVestItem(ss, p) {
  const sheet = ss.getSheetByName('LAIN LAIN');
  if (!sheet) return;

  const row = Number(p.row);
  if (p.ukuran !== undefined) sheet.getRange(row, 4).setValue(p.ukuran);
  if (p.keterangan !== undefined) sheet.getRange(row, 6).setValue(p.keterangan);
}

function handleUpdateFotoStudioItem(ss, p) {
  const sheet = ss.getSheetByName('LAIN LAIN');
  if (!sheet) return;

  const row = Number(p.row);
  if (p.onomoto !== undefined) sheet.getRange(row, 10).setValue(p.onomoto);
  if (p.kuyStudio !== undefined) sheet.getRange(row, 11).setValue(p.kuyStudio);
  if (p.keterangan !== undefined) sheet.getRange(row, 13).setValue(p.keterangan);
}

function formatDateVal(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'GMT+7', 'yyyy-MM-dd');
  }
  return String(val).trim();
}
