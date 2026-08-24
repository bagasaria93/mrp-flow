import { db } from '@/db'
import { purchaseRequests, purchaseRequestApprovals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { Role } from './role'

/**
 * Memproses keputusan approval pada satu purchase request. Validasi role
 * dilakukan di sini (bukan cuma disembunyikan di UI), supaya kalau ada yang
 * coba approve lewat cara lain (curl langsung ke Server Action misalnya),
 * tetap ditolak oleh logika ini, bukan cuma oleh tombol yang disembunyikan.
 *
 * Alur dua tingkat: pending_supervisor -> (approve) -> pending_manager ->
 * (approve) -> approved. Ditolak di tingkat mana pun langsung jadi
 * 'rejected', tidak lanjut ke tingkat berikutnya.
 */
export async function decidePurchaseRequest(
  purchaseRequestId: number,
  role: Role,
  decision: 'approved' | 'rejected',
) {
  const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, purchaseRequestId))
  if (!pr) throw new Error('Purchase request tidak ditemukan')

  if (pr.status === 'approved' || pr.status === 'rejected') {
    throw new Error('Purchase request ini sudah selesai diproses')
  }

  if (pr.status === 'pending_supervisor' && role !== 'supervisor') {
    throw new Error('Hanya Supervisor yang bisa memutuskan di tingkat ini')
  }
  if (pr.status === 'pending_manager' && role !== 'manager') {
    throw new Error('Hanya Manager yang bisa memutuskan di tingkat ini')
  }

  const approverRole: 'supervisor' | 'manager' = pr.status === 'pending_supervisor' ? 'supervisor' : 'manager'

  await db.insert(purchaseRequestApprovals).values({
    purchaseRequestId,
    approverRole,
    decision,
  })

  const nextStatus =
    decision === 'rejected' ? 'rejected' : approverRole === 'supervisor' ? 'pending_manager' : 'approved'

  await db
    .update(purchaseRequests)
    .set({ status: nextStatus })
    .where(eq(purchaseRequests.id, purchaseRequestId))
}
