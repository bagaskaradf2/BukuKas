/**
 * Format angka integer menjadi format Rupiah Indonesia (Rp 1.500.000)
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const num = Math.round(Number(amount));
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format angka murni dengan pemisah ribuan
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(Math.round(Number(num)));
}

/**
 * Format tanggal YYYY-MM-DD atau serial number ke teks Indonesia
 */
export function formatDate(val) {
  if (!val) return '-';
  if (typeof val === 'number') {
    // If it's day of month like 15, 17
    if (val >= 1 && val <= 31) return String(val);
    // If it's Excel serial date
    const date = new Date((val - (25567 + 2)) * 86400 * 1000);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return str;
}
