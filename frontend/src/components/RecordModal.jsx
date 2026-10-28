import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { recordIntegratedTransaction } from '../services/api';
import { formatRupiah } from '../utils/formatters';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function RecordModal({ isOpen, onClose }) {
  const { data, setData, role, showToast, refreshLogs, refreshData } = useApp();
  const members = data?.kartuIuran?.members || [];

  const [jenis, setJenis] = useState('Pengeluaran'); // 'Pengeluaran' or 'Pemasukan'
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [deskripsi, setDeskripsi] = useState('');
  const [targetAlokasi, setTargetAlokasi] = useState('RAB_KONSUMSI');
  const [volume, setVolume] = useState('1');
  const [satuan, setSatuan] = useState('Kali');
  const [harga, setHarga] = useState('');

  // Pemasukan specific
  const [sumberTipe, setSumberTipe] = useState('anggota'); // 'anggota' or 'lain'
  const [member, setMember] = useState('SARAH');
  const [bulanIuran, setBulanIuran] = useState('SEPTEMBER/OKTOBER');
  const [metode, setMetode] = useState('Transfer');
  const [nominalMasuk, setNominalMasuk] = useState('');

  if (!isOpen) return null;

  const calculatedNominal = jenis === 'Pengeluaran'
    ? (Number(volume) || 1) * (Number(harga) || 0)
    : Number(nominalMasuk) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (calculatedNominal <= 0) {
      showToast('Nominal harus lebih dari 0.', 'error');
      return;
    }
    if (jenis === 'Pengeluaran' && !deskripsi.trim()) {
      showToast('Deskripsi kebutuhan wajib diisi.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        jenis,
        tanggal,
        nominal: calculatedNominal,
        deskripsi: jenis === 'Pengeluaran' ? deskripsi.trim() : (sumberTipe === 'anggota' ? `Iuran ${member}` : deskripsi.trim() || 'Pendapatan Lain'),
        targetAlokasi: jenis === 'Pengeluaran' ? targetAlokasi : null,
        volume: Number(volume) || 1,
        satuan: satuan || 'Unit',
        harga: Number(harga) || calculatedNominal,
        member: (jenis === 'Pemasukan' && sumberTipe === 'anggota') ? member : null,
        bulanIuran: jenis === 'Pemasukan' ? bulanIuran : null,
        metode: metode
      };

      // 1. Optimistic Local Update across all sheets instantly
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const tglObj = new Date(tanggal);
        const tglDay = tglObj.getDate();
        const monthIdx = tglObj.getMonth();
        const bulanKas = monthIdx <= 9 ? 'OKTOBER' : (monthIdx === 10 ? 'NOVEMBER' : 'DESEMBER');

        // A. Mutasi Buku Kas
        const kasList = next.bbKas[bulanKas] || [];
        const prevSaldo = kasList.length > 0 ? kasList[kasList.length - 1].saldo : (next?.kartuIuran?.totalDanaKelompok || 0);
        const newSaldo = jenis === 'Pemasukan' ? prevSaldo + calculatedNominal : prevSaldo - calculatedNominal;

        kasList.push({
          row: kasList.length + 8,
          bulanLabel: '',
          tanggal: tglDay,
          deskripsi: payload.deskripsi,
          masuk: jenis === 'Pemasukan' ? calculatedNominal : 0,
          keluar: jenis === 'Pengeluaran' ? calculatedNominal : 0,
          saldo: newSaldo,
          keterangan: payload.targetAlokasi ? payload.targetAlokasi.replace('RAB_', '') : (payload.metode || 'Kas')
        });
        next.bbKas[bulanKas] = kasList;

        // B. Hubungkan ke RAB Harian jika alokasi RAB Harian
        if (jenis === 'Pengeluaran') {
          if (targetAlokasi.startsWith('RAB_')) {
            const catName = targetAlokasi.replace('RAB_', 'RAB ');
            const rabCat = next.rabHarian.find(c => c.category === catName);
            if (rabCat) {
              rabCat.items.push({
                row: rabCat.items.length + 6,
                no: rabCat.items.length + 1,
                kebutuhan: payload.deskripsi,
                volume: payload.volume,
                satuan: payload.satuan,
                harga: payload.harga,
                jumlah: calculatedNominal
              });
              rabCat.total += calculatedNominal;
            }
          } else if (targetAlokasi.startsWith('PROKER_')) {
            const pTitle = targetAlokasi.replace('PROKER_', '');
            const pBlock = next.rabProker.find(b => b.title === pTitle);
            if (pBlock) {
              pBlock.items.push({
                row: pBlock.items.length + 6,
                no: pBlock.items.length + 1,
                kebutuhan: payload.deskripsi,
                volume: payload.volume,
                satuan: payload.satuan,
                harga: payload.harga,
                jumlah: calculatedNominal
              });
              pBlock.total += calculatedNominal;
            }
          }
        }

        // C. Hubungkan ke Kartu Iuran jika Pemasukan
        if (jenis === 'Pemasukan') {
          if (sumberTipe === 'anggota') {
            const mem = next.kartuIuran.members.find(m => m.name === member);
            if (mem && mem.months[bulanIuran]) {
              mem.months[bulanIuran].entries.push({
                slot: mem.months[bulanIuran].entries.length + 1,
                tanggal: tanggal,
                nominal: calculatedNominal,
                metode: metode
              });
              mem.months[bulanIuran].subtotal += calculatedNominal;
              mem.total += calculatedNominal;
              next.kartuIuran.totalDanaKelompok += calculatedNominal;
              next.kartuIuran.totalBersih += calculatedNominal;
            }
          } else {
            const pLain = next.kartuIuran.pendapatanLain;
            if (pLain && pLain.months[bulanIuran]) {
              pLain.months[bulanIuran].entries.push({
                slot: pLain.months[bulanIuran].entries.length + 1,
                tanggal: tanggal,
                nominal: calculatedNominal,
                keterangan: payload.deskripsi
              });
              pLain.months[bulanIuran].subtotal += calculatedNominal;
              pLain.total += calculatedNominal;
              next.kartuIuran.totalDanaKelompok += calculatedNominal;
              next.kartuIuran.totalBersih += calculatedNominal;
            }
          }
        }

        return next;
      });

      // 2. Kirim ke Backend / Google Apps Script
      await recordIntegratedTransaction(payload, role);

      showToast(`Transaksi berhasil dicatat dan terhubung otomatis.`, 'success');
      onClose();
      refreshLogs();
      refreshData(true); // realtime background sync
    } catch (err) {
      showToast('Gagal menyimpan transaksi: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200/80 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">
            Catat Transaksi Terintegrasi
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Jenis Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setJenis('Pengeluaran')}
              className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                jenis === 'Pengeluaran'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => setJenis('Pemasukan')}
              className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                jenis === 'Pemasukan'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pemasukan</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Tanggal Transaksi</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-900 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
              required
            />
          </div>

          {jenis === 'Pengeluaran' ? (
            <>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Deskripsi Kebutuhan</label>
                <input
                  type="text"
                  placeholder="Contoh: Beras 25kg, Gas Elpiji, Cetak Banner"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-900 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Alokasi Anggaran (Otomatis Masuk ke RAB)</label>
                <select
                  value={targetAlokasi}
                  onChange={(e) => setTargetAlokasi(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-900 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none font-medium transition"
                >
                  <optgroup label="RAB Kebutuhan Harian">
                    <option value="RAB_KONSUMSI">RAB Konsumsi</option>
                    <option value="RAB_POSKO/KEBERSIHAN">RAB Posko & Kebersihan</option>
                    <option value="RAB_TRANSPORTASI">RAB Transportasi</option>
                    <option value="RAB_LANGGANAN">RAB Langganan</option>
                    <option value="RAB_SEKRE">RAB Sekretariat</option>
                  </optgroup>
                  <optgroup label="RAB Program Kerja">
                    <option value="PROKER_PENDATAAN MASYARAKAT">Proker Pendataan Masyarakat</option>
                    <option value="PROKER_BIMBINGAN BELAJAR">Proker Bimbingan Belajar</option>
                    <option value="PROKER_PLANG EDUKATIF PADUKUHAN PENGKOL">Proker Plang Edukatif</option>
                    <option value="PROKER_TPA">Proker TPA</option>
                    <option value="PROKER_PEMASANGAN KACA CEMBUUNG">Proker Kaca Cembung</option>
                    <option value="PROKER_JALAN SEHAT DAN POHON HARAPAN">Proker Jalan Sehat</option>
                    <option value="PROKER_PETA BENCANA">Proker Peta Bencana</option>
                    <option value="PROKER_SISTEM PENGELOLAAN SAMPAH">Proker Pengelolaan Sampah</option>
                    <option value="PROKER_PROKER TAMBAHAN">Proker Tambahan</option>
                  </optgroup>
                  <optgroup label="Lainnya">
                    <option value="KAS_UMUM">Kas Umum (Hanya Buku Kas)</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Volume</label>
                  <input
                    type="number"
                    min="1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full px-2.5 py-2 border border-zinc-200 rounded-xl text-center bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition font-medium tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Pcs/Kali"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    className="w-full px-2.5 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Harga Satuan</label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={harga}
                    onChange={(e) => setHarga(e.target.value)}
                    className="w-full px-2.5 py-2 border border-zinc-200 rounded-xl tabular-nums bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition font-medium"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Sumber Dana</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSumberTipe('anggota')}
                    className={`py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      sumberTipe === 'anggota'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Iuran Anggota
                  </button>
                  <button
                    type="button"
                    onClick={() => setSumberTipe('lain')}
                    className={`py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      sumberTipe === 'lain'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Pendapatan Lain
                  </button>
                </div>

                {sumberTipe === 'anggota' ? (
                  <select
                    value={member}
                    onChange={(e) => setMember(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none text-zinc-900 font-semibold transition"
                  >
                    {members.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Keterangan (contoh: Donasi Warga, Bank Jago)"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-900 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Bulan Iuran</label>
                <select
                  value={bulanIuran}
                  onChange={(e) => setBulanIuran(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none text-zinc-900 font-medium transition"
                >
                  {['FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER/OKTOBER'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  placeholder="200000"
                  value={nominalMasuk}
                  onChange={(e) => setNominalMasuk(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold tabular-nums text-zinc-950 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Metode Setoran</label>
                <input
                  type="text"
                  placeholder="Transfer Bank, Cash, E-Wallet"
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition font-medium"
                  required
                />
              </div>
            </>
          )}

          {/* Realtime calculation summary */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
            jenis === 'Pengeluaran'
              ? 'bg-rose-50/50 border-rose-200/80'
              : 'bg-emerald-50/50 border-emerald-200/80'
          }`}>
            <span className="text-zinc-600 font-medium">Total Nilai Transaksi:</span>
            <span className={`font-bold tabular-nums text-sm ${
              jenis === 'Pengeluaran' ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {formatRupiah(calculatedNominal)}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-white font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs ${
                jenis === 'Pengeluaran'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting ? 'Menyimpan...' : 'Catat & Sinkronkan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
