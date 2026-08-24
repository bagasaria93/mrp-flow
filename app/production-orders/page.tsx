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
  planned: 'bg-slate-200 text-slate-700',
  mrp_run: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
}

export default async function ProductionOrdersPage() {
  const orders = await db
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Production Order</h1>
        <Link
          href="/production-orders/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Buat Order Baru
        </Link>
      </div>

      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/production-orders/${o.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {o.productName} <span className="font-normal text-slate-400">{o.productSku}</span>
              </p>
              <p className="text-sm text-slate-500">
                {formatQty(o.quantityOrdered)} {o.unitOfMeasure}
              </p>
            </div>
            <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass[o.status]}`}>
              {statusLabel[o.status]}
            </span>
          </Link>
        ))}

        {orders.length === 0 && <p className="text-slate-400">Belum ada production order.</p>}
      </div>
    </main>
  )
}
