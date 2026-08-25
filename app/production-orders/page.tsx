import { db } from '@/db'
import { productionOrders, products } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { formatQty } from '@/lib/format'

const statusLabel: Record<string, string> = {
  planned: 'Direncanakan',
  mrp_run: 'MRP Sudah Dijalankan',
  completed: 'Selesai',
}
const statusClass: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-600',
  mrp_run: 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
}

const PAGE_SIZE = 10

export default async function ProductionOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const allOrders = await db
    .select({
      id: productionOrders.id,
      quantityOrdered: productionOrders.quantityOrdered,
      status: productionOrders.status,
      productName: products.name,
      productSku: products.sku,
      unitOfMeasure: products.unitOfMeasure,
    })
    .from(productionOrders)
    .innerJoin(products, eq(productionOrders.productId, products.id))
    .orderBy(desc(productionOrders.createdAt))

  const totalPages = Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages)
  const orders = allOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Production Order</h1>
          <p className="mt-1 text-sm text-slate-500">Daftar order produksi dan status MRP-nya.</p>
        </div>
        <Link
          href="/production-orders/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          + Buat Order Baru
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-slate-800">{allOrders.length} Order</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold">Jumlah</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{o.productName}</p>
                    <p className="text-xs text-slate-400">{o.productSku}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatQty(o.quantityOrdered)} {o.unitOfMeasure}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass[o.status]}`}>
                      {statusLabel[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/production-orders/${o.id}`} className="text-sm font-semibold text-primary hover:underline">
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p className="px-4 py-6 text-slate-400">Belum ada production order.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/production-orders?page=${n}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${
                    n === page ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
