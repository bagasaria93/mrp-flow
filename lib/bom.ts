import { db } from '@/db'
import { products, bomItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type BomNode = {
  productId: number
  sku: string
  name: string
  type: 'raw_material' | 'sub_assembly' | 'finished_good'
  unitOfMeasure: string
  stockQuantity: string
  // Untuk komponen di level ini, berapa unit dibutuhkan per 1 unit parent-nya.
  // null untuk node paling atas (root), karena root tidak "dibutuhkan" oleh siapa pun.
  quantityPerParent: string | null
  children: BomNode[]
}

/**
 * Mengambil struktur BOM sebuah produk secara rekursif: produk itu sendiri,
 * lalu semua komponennya, lalu komponen dari komponennya, dan seterusnya
 * sampai mentok di raw material (yang tidak punya baris BOM lagi).
 *
 * Ini fungsi murni terpisah dari komponen React, supaya nanti bisa dipakai
 * ulang oleh MRP engine (yang butuh logika penjelajahan BOM yang sama,
 * tapi untuk menjumlahkan kebutuhan, bukan untuk ditampilkan).
 */
export async function getBomTree(productId: number): Promise<BomNode | null> {
  const [product] = await db.select().from(products).where(eq(products.id, productId))
  if (!product) return null

  return buildNode(product, null)
}

async function buildNode(
  product: typeof products.$inferSelect,
  quantityPerParent: string | null,
): Promise<BomNode> {
  const componentRows = await db
    .select({
      component: products,
      quantityRequired: bomItems.quantityRequired,
    })
    .from(bomItems)
    .innerJoin(products, eq(bomItems.componentProductId, products.id))
    .where(eq(bomItems.parentProductId, product.id))

  const children = await Promise.all(
    componentRows.map((row) => buildNode(row.component, row.quantityRequired)),
  )

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    type: product.type,
    unitOfMeasure: product.unitOfMeasure,
    stockQuantity: product.stockQuantity,
    quantityPerParent,
    children,
  }
}
