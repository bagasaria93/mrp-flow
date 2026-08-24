/**
 * Kolom numeric di Postgres selalu balik sebagai string dengan jumlah
 * desimal tetap sesuai `scale` di schema (contoh: "5.00", "0.50"). Ini
 * bagus untuk presisi kalkulasi, tapi jelek untuk ditampilkan ke user.
 * Fungsi ini merapikan tampilannya: buang nol yang tidak perlu di
 * belakang koma, tapi tetap tampilkan desimal yang memang bermakna.
 */
export function formatQty(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(2).replace(/\.?0+$/, '')
}
