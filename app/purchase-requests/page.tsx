import { db } from '@/db'
import { purchaseRequests, products } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { formatQty } from '@/lib/format'
import { getCurrentRole, ROLE_LABEL } from '@/lib/role'
import { decidePurchaseRequest } from '@/lib/purchase-requests'
import { revalidatePath } from 'next/cache'

async function approveAction(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const role = await getCurrentRole()
  await decidePurchaseRequest(id, role, 'approved')
  revalidatePath('/purchase-requests')
}

async function rejectAction(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const role = await getCurrentRole()
  await decidePurchaseRequest(id, role, 'rejected')
  revalidatePath('/purchase-requests')
}

const statusLabel: Record<string, string> = {
  pending_supervisor: 'Menunggu Supervisor',
  pending_manager: 'Menunggu Manager',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}
const statusClass: Record<string, string> = {
  pending_supervisor: 'bg-warning/15 text-warning',
  pending_manager: 'bg-orange/15 text-orange',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
}

const PAGE_SIZE = 10

export default async function PurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const role = await getCurrentRole()

  const allRows = await db
    .select({
      id: purchaseRequests.id,
      quantityNeeded: purchaseRequests.quantityNeeded,
      status: purchaseRequests.status,
      productName: products.name,
      productSku: products.sku,
      unitOfMeasure: products.unitOfMeasure,
      productionOrderId: purchaseRequests.productionOrderId,
    })
    .from(purchaseRequests)
    .innerJoin(products, eq(purchaseRequests.productId, products.id))
    .orderBy(desc(purchaseRequests.createdAt))

  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages)
  const rows = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const canActOn = (status: string) =>
    (status === 'pending_supervisor' && role === 'supervisor') ||
    (status === 'pending_manager' && role === 'manager')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Purchase Request</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kamu sedang login sebagai <span className="font-semibold text-slate-700">{ROLE_LABEL[role]}</span>.
          Ganti role di topbar kanan atas untuk mencoba sudut pandang approver lain.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-slate-800">{allRows.length} Purchase Request</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Bahan</th>
                <th className="px-4 py-3 font-semibold">Kebutuhan</th>
                <th className="px-4 py-3 font-semibold">Dari Order</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((pr) => (
                <tr key={pr.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/purchase-requests/${pr.id}`} className="group">
                      <p className="font-semibold text-slate-900 group-hover:text-primary">{pr.productName}</p>
                      <p className="text-xs text-slate-400">{pr.productSku}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatQty(pr.quantityNeeded)} {pr.unitOfMeasure}
                  </td>
                  <td className="px-4 py-3 text-slate-500">#{pr.productionOrderId}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass[pr.status]}`}>
                      {statusLabel[pr.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canActOn(pr.status) && (
                        <>
                          <form action={approveAction}>
                            <input type="hidden" name="id" value={pr.id} />
                            <button
                              type="submit"
                              className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                            >
                              Setujui
                            </button>
                          </form>
                          <form action={rejectAction}>
                            <input type="hidden" name="id" value={pr.id} />
                            <button
                              type="submit"
                              className="rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                            >
                              Tolak
                            </button>
                          </form>
                        </>
                      )}
                      <Link
                        href={`/purchase-requests/${pr.id}`}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary/40 hover:text-primary"
                      >
                        Riwayat
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && <p className="px-4 py-6 text-slate-400">Belum ada purchase request.</p>}
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
                  href={`/purchase-requests?page=${n}`}
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
