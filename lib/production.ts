import { db } from '@/db'
import { productionOrders, purchaseRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getBomTree } from './bom'
import { runMrp } from './mrp'

/**
 * Menjalankan MRP untuk sebuah production order yang statusnya masih
 * 'planned', lalu menyimpan hasilnya: bahan baku yang shortage otomatis
 * jadi purchase request baru (status awal pending_supervisor), dan status
 * order berubah jadi 'mrp_run'.
 *
 * Sengaja dijaga idempotent (tidak dobel jalan): kalau order sudah bukan
 * 'planned' lagi, fungsi ini tidak melakukan apa-apa, supaya tidak
 * menghasilkan purchase request duplikat kalau tombolnya ke-klik dua kali.
 */
export async function runMrpForOrder(orderId: number) {
  const [order] = await db.select().from(productionOrders).where(eq(productionOrders.id, orderId))
  if (!order) throw new Error('Production order tidak ditemukan')
  if (order.status !== 'planned') return null

  const tree = await getBomTree(order.productId)
  if (!tree) throw new Error('BOM tidak ditemukan untuk produk ini')

  const result = runMrp(tree, parseFloat(order.quantityOrdered))
  const shortages = result.rawMaterials.filter((rm) => rm.shortage > 0)

  if (shortages.length > 0) {
    await db.insert(purchaseRequests).values(
      shortages.map((rm) => ({
        productionOrderId: order.id,
        productId: rm.productId,
        // toFixed(4) supaya tidak ada sisa presisi floating point JS
        // (misal 27.999999999999996) yang ikut tersimpan ke kolom numeric.
        quantityNeeded: rm.shortage.toFixed(4),
      })),
    )
  }

  await db.update(productionOrders).set({ status: 'mrp_run' }).where(eq(productionOrders.id, order.id))

  return { result, shortageCount: shortages.length }
}
