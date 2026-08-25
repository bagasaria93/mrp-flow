import { db } from '@/db'
import { productionOrders, purchaseRequests, products } from '@/db/schema'

export type DashboardStats = {
  totalProductionOrders: number
  pendingApproval: number
  approved: number
  rejected: number
  statusBreakdown: { status: string; label: string; count: number; color: string }[]
  topShortageMaterials: { name: string; sku: string; unitOfMeasure: string; totalQuantity: number }[]
}

/**
 * Warna status di sini mengikuti palet admin dashboard (primary/success/
 * warning/danger/orange), konsisten dengan warna yang dipakai di seluruh
 * halaman lain. Label teks selalu ditampilkan berdampingan dengan warna,
 * tidak pernah mengandalkan warna saja untuk membedakan status.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Ketiga query di bawah tidak saling bergantung, jadi dijalankan
  // bersamaan (Promise.all), bukan satu-satu menunggu giliran. Neon
  // serverless punya latensi per round-trip yang cukup terasa, jadi
  // menjalankan 3 query berurutan bisa 3x lebih lambat dibanding paralel.
  const [orders, prs, productRows] = await Promise.all([
    db.select().from(productionOrders),
    db.select().from(purchaseRequests),
    db.select().from(products),
  ])

  const countByStatus = (status: string) => prs.filter((p) => p.status === status).length

  const pendingSupervisor = countByStatus('pending_supervisor')
  const pendingManager = countByStatus('pending_manager')
  const approved = countByStatus('approved')
  const rejected = countByStatus('rejected')

  const statusBreakdown = [
    { status: 'pending_supervisor', label: 'Menunggu Supervisor', count: pendingSupervisor, color: '#d97706' },
    { status: 'pending_manager', label: 'Menunggu Manager', count: pendingManager, color: '#ea580c' },
    { status: 'approved', label: 'Disetujui', count: approved, color: '#059669' },
    { status: 'rejected', label: 'Ditolak', count: rejected, color: '#dc2626' },
  ]

  // Total kebutuhan per bahan baku dari purchase request yang masih aktif
  // (bukan yang sudah ditolak, karena itu berarti tidak jadi dibeli).
  const activeRequests = prs.filter((p) => p.status !== 'rejected')
  const totals = new Map<number, number>()
  for (const pr of activeRequests) {
    totals.set(pr.productId, (totals.get(pr.productId) ?? 0) + parseFloat(pr.quantityNeeded))
  }

  const productMap = new Map(productRows.map((p) => [p.id, p]))

  const topShortageMaterials = Array.from(totals.entries())
    .map(([productId, totalQuantity]) => {
      const p = productMap.get(productId)
      return {
        name: p?.name ?? 'Tidak diketahui',
        sku: p?.sku ?? '-',
        unitOfMeasure: p?.unitOfMeasure ?? '',
        totalQuantity,
      }
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5)

  return {
    totalProductionOrders: orders.length,
    pendingApproval: pendingSupervisor + pendingManager,
    approved,
    rejected,
    statusBreakdown,
    topShortageMaterials,
  }
}
