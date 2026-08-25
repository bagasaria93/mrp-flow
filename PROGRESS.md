# MRP Flow: Catatan Progress

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
  dropdown di Topbar, disimpan di cookie `current_role`. Ini keputusan
  sengaja supaya recruiter bisa coba demo tanpa daftar akun.
- **MRP netting**: stok finished good (root production order) TIDAK dipakai
  untuk netting (production order dianggap keputusan final). Stok sub
  rakitan dan bahan baku DIPAKAI untuk netting di tiap level turunnya
  (lihat komentar di `lib/mrp.ts` untuk detail algoritmanya).
- **Tema dikunci terang** di `app/globals.css` (tidak ikut dark mode
  browser), supaya tampilan konsisten kapan pun dibuka.
- **Layout sidebar + topbar** (`components/Sidebar.tsx`,
  `components/Topbar.tsx`), menggantikan NavBar tunggal versi awal. Warna
  aksen dan token warna lengkap ada di `app/globals.css` (`@theme inline`),
  dipakai konsisten lewat kelas Tailwind seperti `bg-primary`,
  `text-warning`, dst. Warna status (kuning/oranye/hijau/merah) mengikuti
  palet yang sudah divalidasi (lihat `lib/dashboard.ts`), selalu
  dipasangkan dengan label teks, tidak pernah mengandalkan warna saja.
- **Seed data dibuat lewat MRP engine asli** (`getBomTree` + `runMrp`),
  bukan angka yang diketik manual, supaya data demo dijamin konsisten
  dengan logika aplikasi yang sesungguhnya, dan sekarang data-driven
  (daftar produk dan BOM didefinisikan sebagai data, bukan insert manual
  satu per satu). Lihat `db/seed.ts`.
- **Pola query BOM harus batch, bukan per node**: `lib/bom.ts` menarik
  seluruh tabel `products` dan `bom_items` sekali (2 query), lalu
  menyusun pohon BOM di memori. Jangan kembalikan ke pola rekursif
  query-per-node, itu penyebab utama halaman `/bom` pernah lambat sekali
  begitu jumlah produk bertambah (lihat bagian optimasi performa di
  bawah).

## Struktur data (db/schema.ts)

- `products`: raw_material | sub_assembly | finished_good digabung 1 tabel
- `bomItems`: self-referencing, quantityRequired per parent
- `productionOrders`: status: planned -> mrp_run -> completed
- `purchaseRequests`: status: pending_supervisor -> pending_manager ->
  approved/rejected
- `purchaseRequestApprovals`: audit trail siapa approve/reject kapan,
  ditampilkan sebagai timeline di `/purchase-requests/[id]`
- `pingTable`: sisa dari uji koneksi awal, sudah tidak dipakai UI, aman
  dihapus kapan saja (tidak mendesak)

## Status pengerjaan

Selesai:
- [x] Setup Next.js + TypeScript + React + Tailwind + Drizzle + Neon
- [x] Schema database lengkap (5 tabel + enum)
- [x] Seed data skala besar: 10 produk jadi, BOM 2 level, total 44 produk
      (termasuk sub rakitan dan bahan baku), 22 production order dengan
      riwayat approval bervariasi (pola siklis 4 kondisi: disetujui
      penuh, ditolak sebagian, belum diproses sama sekali, disetujui
      Supervisor saja/menunggu Manager). Lihat `db/seed.ts`.
- [x] Halaman struktur BOM rekursif (`/bom`), dioptimasi jadi 2 query
      total (lihat catatan optimasi performa di bawah)
- [x] MRP engine pure function (`lib/mrp.ts`) + halaman uji (`/mrp-test`)
- [x] Buat production order (`/production-orders/new`)
- [x] Jalankan MRP dari halaman detail order, auto-generate purchase
      request untuk shortage (`/production-orders/[id]`)
- [x] Halaman purchase request + approve/reject sesuai role, dengan
      pagination (`/purchase-requests`)
- [x] Halaman detail purchase request dengan timeline riwayat approval
      (`/purchase-requests/[id]`)
- [x] Dashboard halaman awal dengan KPI tile dan 2 bar chart (breakdown
      status purchase request, bahan baku paling banyak diminta),
      dihitung dari `lib/dashboard.ts`, mengikuti metodologi skill dataviz
      (palet status tervalidasi, label langsung, tanpa dual-axis)
- [x] Halaman daftar production order dengan pagination
      (`/production-orders`)
- [x] Pagination 10 baris per halaman di `/production-orders` dan
      `/purchase-requests`, keduanya pakai tabel HTML asli (bukan kartu
      list), sesuai jumlah data yang sekarang jauh lebih banyak
- [x] Redesign visual menyeluruh dari NavBar monokrom jadi layout
      sidebar + topbar, ikon custom (`components/icons.tsx`), StatTile
      minimal tanpa border warna tebal, palet warna sendiri (indigo
      sebagai primary, bukan sekadar meniru template gratisan)
- [x] Optimasi performa: query dashboard dan halaman detail
      diparalelkan dengan `Promise.all`, dan pola query BOM diubah dari
      rekursif per-node jadi batch 2 query (lihat detail di bawah)

Belum, atau belum dikonfirmasi:
- [ ] Konfirmasi hasil optimasi `/bom` di browser (sebelum fix: 2.2-3.5
      detik, application-code mendominasi; fix sudah masuk kode, belum
      ada laporan angka baru dari user)
- [ ] Konfirmasi `/purchase-requests/[id]` tidak crash lagi setelah
      restart bersih dev server (proses lama PID 5984 yang menahan port
      3000 sudah dimatikan tanggal 2026-08-25, tapi belum ada laporan
      hasil testing ulang halaman ini)
- [ ] Konfirmasi `npm run db:seed` sudah dijalankan ulang dengan data
      baru (44 produk, 22 order) di sisi user
- [ ] Konfirmasi Windows Defender exclusion untuk folder project sudah
      ditambahkan (rekomendasi mengatasi overhead di luar waktu query
      database)
- [ ] Deploy ke Vercel (set env var DATABASE_URL di sana, dsb)
- [ ] Link dari portofolio GitHub Pages ke demo Vercel
- [ ] Cleanup opsional: hapus `pingTable`/`/mrp-test`, dan folder
      `_to_delete/` (lihat catatan di bawah) kalau mau lebih bersih
      sebelum deploy final

## Redesign dan optimasi 2026-08-25

Lanjutan dari redesign 2026-08-24 (data lebih kaya + dashboard). User
menilai versi 2026-08-24 masih "sampah" secara visual, dibandingkan
dengan portofolio pribadinya sendiri di bagasaria93.github.io. Setelah
dibandingkan langsung, arah yang disepakati: identitas visual sendiri,
level craft dinaikkan, tetap genre dashboard ERP tapi tidak terasa
seperti template Bootstrap gratisan.

1. **Layout sidebar + topbar**: `components/Sidebar.tsx` (navigasi kiri,
   flat, aksen border kiri untuk item aktif) dan `components/Topbar.tsx`
   (role switcher) menggantikan `components/NavBar.tsx` yang lama
   (dipindah ke `_to_delete/NavBar.tsx`, device_bash yang dipakai sesi
   ini tidak bisa hapus file langsung, jadi file lama dipindah ke folder
   ini, aman dihapus manual dari sisi user kalau mau beres-beres).
2. **Ikon custom**: `components/icons.tsx`, SVG inline buatan sendiri,
   bukan library ikon eksternal.
3. **StatTile dirombak**: kartu metrik minimal (dot aksen kecil + label,
   angka besar, tanpa border warna tebal di sisi kiri seperti versi
   sebelumnya).
4. **Palet warna final** di `app/globals.css`: primary indigo (#4f46e5),
   warna status disesuaikan lagi (warning #d97706, orange #ea580c,
   success #059669, danger #dc2626) supaya lebih redup/profesional,
   tidak terlalu terang seperti versi awal.
5. **Data diperbesar signifikan**: `db/seed.ts` ditulis ulang jadi
   data-driven (daftar `RAW_MATERIALS`, `FINISHED_GOODS`,
   `ORDER_PLAN` sebagai data, bukan insert manual satu per satu). Hasil
   akhir: 10 produk jadi, total 44 produk, 22 production order, dengan
   pola approval siklis 4 kondisi supaya demo tetap terasa hidup dan
   bervariasi meski datanya jauh lebih banyak.
6. **Pagination ditambahkan**: `/production-orders` dan
   `/purchase-requests` sekarang pakai `searchParams: Promise<{ page?:
   string }>`, 10 baris per halaman, dan sudah dikonversi dari kartu list
   ke tabel HTML asli.

### Investigasi performa

User melaporkan setiap pindah halaman terasa berdetik-detik, bukan
instan. Investigasi dilakukan bertahap, tidak menebak:

1. **Query sequential jadi paralel**: `lib/dashboard.ts`,
   `app/purchase-requests/[id]/page.tsx`, dan
   `app/production-orders/[id]/page.tsx` awalnya melakukan beberapa query
   `await` berurutan padahal saling independen. Diubah ke `Promise.all`.
   Hasil terukur: TTFB dashboard turun dari sekitar 9.7 detik ke 5.1
   detik.
2. **Isolasi waktu database vs overhead lain**: dibuat endpoint
   diagnostik sementara (`/api/ping-db`, sudah dihapus, dipindah ke
   `_to_delete/api-ping-db/`) yang hanya menjalankan `select 1`, diukur
   dari browser user dengan `performance.now()`. Hasil: waktu query Neon
   asli cuma 495-2182ms, sementara total round trip 3188-8389ms, artinya
   4.5-6.5+ detik ada di luar database. Dugaan kuat: Windows Defender
   memindai `node_modules`/`.next` secara real-time saat dev server jalan
   di Windows, penyebab umum yang dikenal luas untuk masalah ini.
   Rekomendasi: tambahkan folder exclusion Windows Defender untuk
   `C:\Project Demo\mrp-flow`.
3. **Proses dev server lama yang zombie**: dari log terminal user
   ditemukan proses `next dev` lama (PID 5984) masih menahan port 3000
   sejak sebelumnya, membuat `npm run dev` yang dijalankan ulang beberapa
   kali sebenarnya tidak pernah benar-benar menggantikan proses lama itu.
   Proses ini sudah dimatikan (`taskkill /PID 5984 /F` lalu
   `taskkill /F /IM node.exe`), dev server sekarang bind bersih ke port
   3000.
4. **Pola N+1 query di `lib/bom.ts`** (penyebab utama lambatnya khusus
   halaman `/bom`, ditemukan setelah restart bersih): versi lama
   melakukan 1 query terpisah untuk tiap node pohon BOM (produk jadi,
   tiap sub rakitan, bahkan tiap bahan baku di ujung pohon yang
   sebenarnya tidak punya anak). Dengan Neon memakai driver HTTP tanpa
   koneksi persisten, tiap query berarti 1 round trip jaringan penuh.
   Dengan 10 produk jadi sekarang, halaman `/bom` bisa memicu ratusan
   query berantai, cocok dengan log server yang menunjukkan 2.2-3.5 detik
   di `/bom`, hampir semuanya di `application-code` bukan `next.js`.
   Fix: `lib/bom.ts` ditulis ulang supaya menarik seluruh tabel
   `products` dan `bom_items` sekali (2 query total, berapa pun jumlah
   produknya), lalu menyusun pohon di memori tanpa query tambahan.
   `getBomTree(productId)` (dipakai halaman detail order, halaman uji
   MRP, dan seed) dan `getBomTrees(productIds[])` (versi batch baru,
   dipakai halaman `/bom` supaya semua pohon dibangun dari 1 index yang
   sama) sama-sama diuntungkan. **Belum dikonfirmasi angka barunya di
   browser user**, ini yang perlu ditest lebih dulu di sesi berikutnya.

**PENTING untuk sesi berikutnya**: kalau ada halaman lain yang terasa
lambat lagi padahal `application-code`-nya yang tinggi (bukan `next.js`
atau waktu kompilasi Turbopack), curigai dulu pola query N+1 seperti di
atas sebelum menyalahkan jaringan atau antivirus lagi. Cara ceknya: lihat
log terminal `npm run dev`, breakdown `next.js:` vs `application-code:`
sudah otomatis ditampilkan Next.js di tiap baris log request.

## Testing end-to-end (2026-08-24, sebelum redesign 2026-08-25)

Sudah dicoba langsung di browser (versi sebelum redesign 2026-08-25):
buat order -> jalankan MRP -> approve Supervisor -> approve Manager, dan
juga jalur tolak di level Supervisor. Semua sesuai spesifikasi.

Bug yang ditemukan dan sudah diperbaiki: dropdown role di NavBar (lalu
Topbar) pakai `<select defaultValue={role}>` tanpa `key`. Karena
`<select>` uncontrolled, React tidak memaksa browser mengikuti
`defaultValue` baru setelah re-render dari server action (ganti role),
jadi kadang dropdown menampilkan role lama walau cookie dan halaman lain
sudah benar. Fix: tambah `key={role}` supaya elemen di-remount tiap kali
role berubah. Fix ini dipertahankan di `components/Topbar.tsx`.

## Cara jalan lokal (kalau mulai sesi baru)

```
cd "C:\Project Demo\mrp-flow"
npm run dev
```

Buka `localhost:3000`. Kalau port 3000 dilaporkan sudah dipakai proses
lain padahal seharusnya tidak ada dev server jalan, cek dulu proses
zombie sebelum asal percaya "sudah direstart" (lihat catatan investigasi
performa di atas, ini pernah kejadian dan menyesatkan diagnosis).

Reset data contoh: `npm run db:seed`. Terapkan perubahan schema:
`npm run db:push`.

## Test case manual untuk verifikasi MRP (dari data seed lama, 1 produk)

Catatan: ini test case dari seed versi paling awal (1 produk, sebelum
redesign 2026-08-24). Seed versi sekarang (10 produk jadi, 44 produk
total) dihitung otomatis lewat MRP engine asli saat seeding, jadi tidak
dihitung manual di sini, tapi logika nettingnya identik dan sudah
dibuktikan konsisten oleh `createOrderWithMrp()` di `db/seed.ts`.

Order 10 pcs Kursi Kayu (FG-001):
- Rangka Kayu: perlu produksi 7 pcs (stok 3, butuh 10)
- Dudukan Kayu: perlu produksi 8 pcs (stok 2, butuh 10)
- Kayu Balok: total butuh 28, stok 20, **kurang 8** (satu-satunya shortage)
- Sekrup: total butuh 84, stok 100, cukup
- Papan Kayu: total butuh 8, stok 8, cukup (pas)
- Busa: total butuh 4, stok 10, cukup
