import { db } from '@/db'
import { purchaseRequests, products } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
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
  pending_supervisor: 'bg-amber-100 text-amber-800',
  pending_manager: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function PurchaseRequestsPage() {
  const role = await getCurrentRole()

  const rows = await db
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

  const canActOn = (status: string) =>
    (status === 'pending_supervisor' && role === 'supervisor') ||
    (status === 'pending_manager' && role === 'manager')

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Purchase Request</h1>
      <p className="mt-1 mb-6 text-slate-500">
        Kamu sedang login sebagai <span className="font-semibold text-slate-700">{ROLE_LABEL[role]}</span>.
        Ganti role di pojok kanan atas untuk mencoba sudut pandang approver lain.
      </p>

      <div className="space-y-3">
        {rows.map((pr) => (
          <div key={pr.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {pr.productName} <span className="font-normal text-slate-400">{pr.productSku}</span>
                </p>
                <p className="text-sm text-slate-500">
                  butuh {formatQty(pr.quantityNeeded)} {pr.unitOfMeasure} &middot; dari order #
                  {pr.productionOrderId}
                </p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass[pr.status]}`}>
                {statusLabel[pr.status]}
              </span>
            </div>

            {canActOn(pr.status) && (
              <div className="mt-3 flex gap-2">
                <form action={approveAction}>
                  <input type="hidden" name="id" value={pr.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Setujui
                  </button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="id" value={pr.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Tolak
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}

        {rows.length === 0 && <p className="text-slate-400">Belum ada purchase request.</p>}
      </div>
    </main>
  )
}
