import { db } from '@/db'
import { purchaseRequests, products, purchaseRequestApprovals, productionOrders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatQty } from '@/lib/format'
import { getCurrentRole, ROLE_LABEL } from '@/lib/role'
import { decidePurchaseRequest } from '@/lib/purchase-requests'
import { revalidatePath } from 'next/cache'

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
const roleLabel: Record<string, string> = { supervisor: 'Supervisor', manager: 'Manager' }
const decisionLabel: Record<string, string> = { approved: 'menyetujui', rejected: 'menolak' }
const decisionDotClass: Record<string, string> = { approved: 'bg-success', rejected: 'bg-danger' }

export default async function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const requestId = Number(id)
  const role = await getCurrentRole()

  // pr dan approvals sama-sama cuma butuh requestId (tidak saling
  // bergantung), jadi dijalankan bersamaan. order baru bisa dicari setelah
  // pr selesai (butuh pr.productionOrderId), jadi tetap menyusul belakangan.
  const [[pr], approvals] = await Promise.all([
    db
      .select({
        id: purchaseRequests.id,
        quantityNeeded: purchaseRequests.quantityNeeded,
        status: purchaseRequests.status,
        createdAt: purchaseRequests.createdAt,
        productionOrderId: purchaseRequests.productionOrderId,
        productName: products.name,
        productSku: products.sku,
        unitOfMeasure: products.unitOfMeasure,
      })
      .from(purchaseRequests)
      .innerJoin(products, eq(purchaseRequests.productId, products.id))
      .where(eq(purchaseRequests.id, requestId)),
    db
      .select()
      .from(purchaseRequestApprovals)
      .where(eq(purchaseRequestApprovals.purchaseRequestId, requestId))
      .orderBy(purchaseRequestApprovals.decidedAt),
  ])

  if (!pr) notFound()

  const [order] = await db
    .select({ id: productionOrders.id, productId: productionOrders.productId })
    .from(productionOrders)
    .where(eq(productionOrders.id, pr.productionOrderId))

  async function approveAction() {
    'use server'
    const currentRole = await getCurrentRole()
    await decidePurchaseRequest(requestId, currentRole, 'approved')
    revalidatePath(`/purchase-requests/${requestId}`)
  }

  async function rejectAction() {
    'use server'
    const currentRole = await getCurrentRole()
    await decidePurchaseRequest(requestId, currentRole, 'rejected')
    revalidatePath(`/purchase-requests/${requestId}`)
  }

  const canAct =
    (pr.status === 'pending_supervisor' && role === 'supervisor') ||
    (pr.status === 'pending_manager' && role === 'manager')

  // Susun timeline: diajukan (selalu ada) -> tiap approval -> tahap yang
  // masih menunggu (kalau belum selesai).
  const timeline: { label: string; sub: string; dotClass: string }[] = [
    {
      label: 'Diajukan',
      sub: `Dibuat otomatis dari hasil MRP order #${pr.productionOrderId}`,
      dotClass: 'bg-slate-400',
    },
    ...approvals.map((a) => ({
      label: `${roleLabel[a.approverRole]} ${decisionLabel[a.decision]}`,
      sub: new Date(a.decidedAt).toLocaleString('id-ID'),
      dotClass: decisionDotClass[a.decision],
    })),
  ]
  if (pr.status === 'pending_supervisor' || pr.status === 'pending_manager') {
    timeline.push({
      label: `Menunggu ${pr.status === 'pending_supervisor' ? 'Supervisor' : 'Manager'}`,
      sub: 'Belum ada keputusan',
      dotClass: 'bg-slate-200',
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/purchase-requests" className="text-sm text-slate-400 hover:text-primary">
          &larr; Semua purchase request
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {pr.productName} <span className="font-normal text-slate-400">{pr.productSku}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Butuh {formatQty(pr.quantityNeeded)} {pr.unitOfMeasure} &middot;{' '}
              {order ? (
                <Link href={`/production-orders/${order.id}`} className="text-primary hover:underline">
                  dari production order #{pr.productionOrderId}
                </Link>
              ) : (
                `dari order #${pr.productionOrderId}`
              )}
            </p>
          </div>
          <span className={`rounded px-3 py-1 text-sm font-semibold ${statusClass[pr.status]}`}>
            {statusLabel[pr.status]}
          </span>
        </div>

        <div className="px-4 py-4">
          {canAct ? (
            <div className="flex gap-2">
              <form action={approveAction}>
                <button
                  type="submit"
                  className="rounded-md bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Setujui sebagai {ROLE_LABEL[role]}
                </button>
              </form>
              <form action={rejectAction}>
                <button
                  type="submit"
                  className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Tolak
                </button>
              </form>
            </div>
          ) : (
            (pr.status === 'pending_supervisor' || pr.status === 'pending_manager') && (
              <p className="text-sm text-slate-400">
                Kamu login sebagai {ROLE_LABEL[role]}, tidak berwenang memutuskan di tahap ini. Ganti role
                di topbar kanan atas untuk mencoba.
              </p>
            )
          )}

          <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-800">
            Riwayat Approval
          </h2>
          <div className="space-y-4 border-l-2 border-slate-100 pl-4">
            {timeline.map((step, i) => (
              <div key={i} className="relative">
                <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${step.dotClass}`} />
                <p className="text-sm font-semibold text-slate-800">{step.label}</p>
                <p className="text-xs text-slate-400">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
