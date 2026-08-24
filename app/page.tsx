import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">MRP Flow</h1>
      <p className="mt-3 max-w-xl text-slate-600">
        Demo alur manufaktur end-to-end: struktur BOM multi-level, MRP explosion dengan netting stok
        per level, purchase request otomatis untuk bahan baku yang kurang, sampai approval dua
        tingkat (Supervisor lalu Manager). Dibangun dengan Next.js, TypeScript, React, dan Postgres
        (Drizzle ORM).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/bom" className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300">
          <p className="font-semibold text-slate-900">Struktur BOM</p>
          <p className="mt-1 text-sm text-slate-500">
            Lihat pohon BOM Kursi Kayu, dari produk jadi sampai bahan baku.
          </p>
        </Link>
        <Link
          href="/production-orders"
          className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
        >
          <p className="font-semibold text-slate-900">Production Order</p>
          <p className="mt-1 text-sm text-slate-500">Buat order produksi dan jalankan MRP.</p>
        </Link>
        <Link
          href="/purchase-requests"
          className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
        >
          <p className="font-semibold text-slate-900">Purchase Request</p>
          <p className="mt-1 text-sm text-slate-500">
            Proses approval dua tingkat, ganti role untuk mencoba tiap sudut pandang.
          </p>
        </Link>
      </div>
    </main>
  )
}
