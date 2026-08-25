import { db } from '@/db'
import { productionOrders, products, purchaseRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getBomTree } from '@/lib/bom'
import { runMrp } from '@/lib/mrp'
import { formatQty } from '@/lib/format'
import { runMrpForOrder } from '@/lib/production'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

async function runMrpAction(formData: FormData) {
  'use server'
  const orderId = Number(formData.get('orderId'))
  await runMrpForOrder(orderId)
  redirect(`/production-orders/${orderId}`)
}

const orderStatusLabel: Record<string, string> = {
  planned: 'Direncanakan',
  mrp_run: 'MRP Sudah Dijalankan',
  completed: 'Selesai',
}

const prStatusLabel: Record<string, string> = {
  pending_supervisor: 'Menunggu Supervisor',
  pending_manager: 'Menunggu Manager',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}
const prStatusClass: Record<string, string> = {
  pending_supervisor: 'bg-warning/15 text-warning',
  pending_manager: 'bg-orange/15 text-orange',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
}

export default async function ProductionOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orderId = Number(id)

  const [order] = await db
    .select({
      id: productionOrders.id,
      quantityOrdered: productionOrders.quantityOrdered,
      status: productionOrders.status,
      productId: productionOrders.productId,
      productName: products.name,
      productSku: products.sku,
      unitOfMeasure: products.unitOfMeasure,
    })
    .from(productionOrders)
    .innerJoin(products, eq(productionOrders.productId, products.id))
    .where(eq(productionOrders.id, orderId))

  if (!order) notFound()

  // Preview dihitung ulang langsung dari BOM dan stok terkini, murni untuk
  // ditampilkan, tidak menulis apa pun ke database. Berguna baik sebelum
  // MRP dijalankan (simulasi) maupun sesudahnya (konteks tambahan).
  // Kedua query di bawah cuma butuh `order` yang sudah ada, tidak saling
  // bergantung satu sama lain, jadi dijalankan bersamaan lewat Promise.all.
  const [tree, relatedPurchaseRequests] = await Promise.all([
    getBomTree(order.productId),
    order.status !== 'planned'
      ? db
          .select({
            id: purchaseRequests.id,
            quantityNeeded: purchaseRequests.quantityNeeded,
            status: purchaseRequests.status,
            productName: products.name,
            productSku: products.sku,
            unitOfMeasure: products.unitOfMeasure,
          })
          .from(purchaseRequests)
          .innerJoin(products, eq(purchaseRequests.productId, products.id))
          .where(eq(purchaseRequests.productionOrderId, order.id))
      : Promise.resolve([]),
  ])
  const preview = tree ? runMrp(tree, parseFloat(order.quantityOrdered)) : null

  return (
    <div className="space-y-6">
      <div>
        <Link href="/production-orders" className="text-sm text-slate-400 hover:text-primary">
          &larr; Semua production order
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-800">
          Order #{order.id}: {order.productName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {formatQty(order.quantityOrdered)} {order.unitOfMeasure} &middot; status:{' '}
          <span className="font-semibold text-slate-700">
            {orderStatusLabel[order.status] ?? order.status}
          </span>
        </p>
      </div>

      {preview && (
        <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-warning">Sub Rakitan yang Perlu Diproduksi</h2>
          </div>
          <div className="p-4">
            {preview.subAssembliesToProduce.length === 0 ? (
              <p className="text-sm text-slate-500">
                Stok sub rakitan sudah cukup, tidak perlu produksi tambahan.
              </p>
            ) : (
              <ul className="space-y-1 text-sm text-slate-700">
                {preview.subAssembliesToProduce.map((sa) => (
                  <li key={sa.productId}>
                    {sa.name} ({sa.sku}): produksi{' '}
                    <span className="font-semibold">
                      {formatQty(sa.quantityToProduce)} {sa.unitOfMeasure}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {order.status === 'planned' && preview && (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-slate-800">Pratinjau Kebutuhan Bahan Baku</h2>
            </div>
            <div className="p-4">
              <p className="mb-3 text-sm text-slate-500">
                Ini simulasi hasil MRP kalau dijalankan sekarang. Klik tombol di bawah untuk benar-benar
                menjalankannya dan membuat purchase request otomatis untuk bahan baku yang kurang.
              </p>
              <ul className="space-y-1 text-sm text-slate-700">
                {preview.rawMaterials.map((rm) => (
                  <li key={rm.productId}>
                    {rm.name}: butuh {formatQty(rm.totalRequired)}, stok {formatQty(rm.stockQuantity)},{' '}
                    <span className={rm.shortage > 0 ? 'font-semibold text-danger' : 'text-success'}>
                      {rm.shortage > 0 ? `kurang ${formatQty(rm.shortage)}` : 'cukup'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form action={runMrpAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Jalankan MRP
            </button>
          </form>
        </>
      )}

      {order.status !== 'planned' && (
        <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-slate-800">Purchase Request yang Dibuat</h2>
          </div>
          <div className="p-4">
            {relatedPurchaseRequests.length === 0 && (
              <p className="text-sm text-slate-400">
                Tidak ada shortage, semua bahan baku cukup, tidak perlu purchase request.
              </p>
            )}
            <div className="space-y-2">
              {relatedPurchaseRequests.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
                >
                  <span className="text-slate-900">
                    {pr.productName} <span className="text-slate-400">{pr.productSku}</span>: butuh{' '}
                    {formatQty(pr.quantityNeeded)} {pr.unitOfMeasure}
                  </span>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${prStatusClass[pr.status]}`}>
                    {prStatusLabel[pr.status]}
                  </span>
                </div>
              ))}
            </div>
            {relatedPurchaseRequests.length > 0 && (
              <Link
                href="/purchase-requests"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Lihat dan proses approval &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
