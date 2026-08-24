# MRP Flow — Catatan Progress

Demo portofolio: alur manufaktur end-to-end (BOM multi-level, MRP explosion
dengan netting stok, purchase request otomatis, approval 2 tingkat).
Stack: Next.js 16 (App Router), TypeScript, React 19, Tailwind, Drizzle ORM,
Neon Postgres. Target akhir: deploy ke Vercel, dilink dari portofolio GitHub
Pages (bagasaria93.github.io).

## Keputusan desain penting (supaya sesi berikutnya tidak menebak ulang)

- **BOM multi-level**: self-referencing lewat tabel `bom_items`
  (parentProductId, componentProductId), bukan cuma 1 level.
- **Approval 2 tingkat**: pending_supervisor -> pending_manager -> approved,
  ditolak di tingkat mana pun langsung jadi rejected (tidak lanjut).
- **Tidak ada login sungguhan**: role (Staff/Supervisor/Manager) dipilih dari
  dropdown di NavBar, disimpan di cookie `current_role`. Ini keputusan
  sengaja supaya recruiter bisa coba demo tanpa daftar akun.
- **MRP netting**: stok finished good (root production order) TIDAK dipakai
  untuk netting (production order dianggap keputusan final). Stok sub
  rakitan dan bahan baku DIPAKAI untuk netting di tiap level turunnya
  (lihat komentar di `lib/mrp.ts` untuk detail algoritmanya).
- **Tema dikunci terang** di `app/globals.css` (tidak ikut dark mode
  browser), supaya tampilan konsisten kapan pun dibuka.

## Struktur data (db/schema.ts)

- `products` — raw_material | sub_assembly | finished_good digabung 1 tabel
- `bomItems` — self-referencing, quantityRequired per parent
- `productionOrders` — status: planned -> mrp_run -> completed
- `purchaseRequests` — status: pending_supervisor -> pending_manager ->
  approved/rejected
- `purchaseRequestApprovals` — audit trail siapa approve/reject kapan
- `pingTable` — sisa dari uji koneksi awal, sudah tidak dipakai UI, aman
  dihapus kapan saja (tidak mendesak)

## Status pengerjaan

Selesai:
- [x] Setup Next.js + TypeScript + React + Tailwind + Drizzle + Neon
- [x] Schema database lengkap (5 tabel + enum)
- [x] Seed data contoh: Kursi Kayu (finished good) -> Rangka Kayu + Dudukan
      Kayu (sub assembly) -> Kayu Balok, Sekrup, Papan Kayu, Busa (raw
      material). Lihat `db/seed.ts`.
- [x] Halaman struktur BOM rekursif (`/bom`)
- [x] MRP engine pure function (`lib/mrp.ts`) + halaman uji (`/mrp-test`)
- [x] Buat production order (`/production-orders/new`)
- [x] Jalankan MRP dari halaman detail order, auto-generate purchase
      request untuk shortage (`/production-orders/[id]`)
- [x] Halaman purchase request + approve/reject sesuai role
      (`/purchase-requests`)
- [x] NavBar + role switcher + dashboard di halaman awal

Belum:
- [ ] Deploy ke Vercel (set env var DATABASE_URL di sana, dsb)
- [ ] Link dari portofolio GitHub Pages ke demo Vercel
- [ ] Cleanup opsional: hapus `pingTable`/`/mrp-test` kalau mau lebih bersih
      sebelum deploy final

## Testing end-to-end (2026-08-24)

Sudah dicoba langsung di browser: buat order -> jalankan MRP -> approve
Supervisor -> approve Manager, dan juga jalur tolak di level Supervisor.
Semua sesuai spesifikasi (hasil MRP order 10 pcs Kursi Kayu cocok dengan
test case manual di atas; PR yang ditolak di Supervisor langsung
`rejected`, tidak lanjut ke Manager).

Bug yang ditemukan dan sudah diperbaiki: dropdown role di NavBar
(`components/NavBar.tsx`) pakai `<select defaultValue={role}>` tanpa
`key`. Karena `<select>` uncontrolled, React tidak memaksa browser
mengikuti `defaultValue` baru setelah re-render dari server action
(ganti role) -- jadi kadang dropdown menampilkan role lama walau cookie
dan halaman lain sudah benar. Fix: tambah `key={role}` supaya elemen
di-remount tiap kali role berubah. Sudah diverifikasi build tetap lolos
dan switch role di beberapa skenario berturut-turut hasilnya konsisten.

## Cara jalan lokal (kalau mulai sesi baru)

```
cd "C:\Project Demo\mrp-flow"
npm run dev
```

Buka `localhost:3000`. Reset data contoh: `npm run db:seed`. Terapkan
perubahan schema: `npm run db:push`.

## Test case manual untuk verifikasi MRP (dari data seed)

Order 10 pcs Kursi Kayu:
- Rangka Kayu: perlu produksi 7 pcs (stok 3, butuh 10)
- Dudukan Kayu: perlu produksi 8 pcs (stok 2, butuh 10)
- Kayu Balok: total butuh 28, stok 20, **kurang 8** (satu-satunya shortage)
- Sekrup: total butuh 84, stok 100, cukup
- Papan Kayu: total butuh 8, stok 8, cukup (pas)
- Busa: total butuh 4, stok 10, cukup
