import { db } from '@/db'
import { products, bomItems } from '@/db/schema'

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

type ProductRow = typeof products.$inferSelect
type ChildEntry = { component: ProductRow; quantityRequired: string }

/**
 * Index seluruh produk + baris BOM dalam 2 query saja (bukan 1 query per
 * node seperti versi sebelumnya). Awalnya getBomTree() rekursif melakukan
 * query terpisah untuk tiap produk dan tiap baris bom_items di tiap level,
 * yang berarti 1 pohon BOM 3 level bisa memicu belasan round trip jaringan
 * ke Neon (driver HTTP tanpa koneksi persisten, jadi tiap query = 1 request
 * HTTP penuh). Dengan katalog produk yang sekarang lebih besar (44 produk),
 * halaman /bom yang menampilkan banyak pohon sekaligus bisa memicu ratusan
 * query berantai, itulah sumber lambatnya. Fix: tarik semua data sekali,
 * susun pohonnya di memori (sinkron, tanpa query tambahan).
 */
async function loadBomIndex() {
  const [allProducts, allBomItems] = await Promise.all([
    db.select().from(products),
    db.select().from(bomItems),
  ])

  const productById = new Map<number, ProductRow>(allProducts.map((p) => [p.id, p]))

  const childrenByParent = new Map<number, ChildEntry[]>()
  for (const item of allBomItems) {
    const component = productById.get(item.componentProductId)
    if (!component) continue
    const list = childrenByParent.get(item.parentProductId) ?? []
    list.push({ component, quantityRequired: item.quantityRequired })
    childrenByParent.set(item.parentProductId, list)
  }

  return { productById, childrenByParent }
}

function buildNodeSync(
  product: ProductRow,
  quantityPerParent: string | null,
  childrenByParent: Map<number, ChildEntry[]>,
): BomNode {
  const componentRows = childrenByParent.get(product.id) ?? []
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    type: product.type,
    unitOfMeasure: product.unitOfMeasure,
    stockQuantity: product.stockQuantity,
    quantityPerParent,
    children: componentRows.map((row) =>
      buildNodeSync(row.component, row.quantityRequired, childrenByParent),
    ),
  }
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
  const { productById, childrenByParent } = await loadBomIndex()
  const product = productById.get(productId)
  if (!product) return null
  return buildNodeSync(product, null, childrenByParent)
}

/**
 * Versi batch: ambil banyak pohon BOM sekaligus tapi tetap cuma 2 query
 * total (bukan 2 query dikali jumlah produk). Dipakai halaman /bom yang
 * menampilkan semua produk jadi sekaligus.
 */
export async function getBomTrees(productIds: number[]): Promise<(BomNode | null)[]> {
  const { productById, childrenByParent } = await loadBomIndex()
  return productIds.map((id) => {
    const product = productById.get(id)
    return product ? buildNodeSync(product, null, childrenByParent) : null
  })
}
