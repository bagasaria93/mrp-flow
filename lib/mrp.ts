import type { BomNode } from './bom'

export type MaterialRequirement = {
  productId: number
  sku: string
  name: string
  unitOfMeasure: string
  stockQuantity: number
  totalRequired: number
  shortage: number
}

export type SubAssemblyToProduce = {
  productId: number
  sku: string
  name: string
  unitOfMeasure: string
  quantityToProduce: number
}

export type MrpResult = {
  subAssembliesToProduce: SubAssemblyToProduce[]
  rawMaterials: MaterialRequirement[]
}

/**
 * BOM explosion dengan netting stok di tiap level, bukan cuma di level
 * bahan baku paling bawah. Alurnya:
 *
 * 1. Production order dianggap keputusan final: stok finished good itu
 *    sendiri TIDAK mengurangi jumlah yang mau diproduksi (root node selalu
 *    pakai gross requirement penuh).
 * 2. Begitu turun ke sub rakitan, stok yang ada dipakai untuk netting.
 *    Kalau sudah punya 3 Rangka Kayu dan butuh 10, yang perlu benar-benar
 *    diproduksi cuma 7. Angka 7 inilah yang diteruskan untuk menghitung
 *    kebutuhan bahan baku di bawahnya, bukan 10.
 * 3. Di level bahan baku (leaf, tidak punya children), hasil akhirnya
 *    dibandingkan dengan stok bahan baku itu sendiri untuk menentukan
 *    shortage, yaitu berapa yang perlu dibeli.
 * 4. Satu bahan baku bisa dipakai di banyak cabang BOM sekaligus (sekrup
 *    dipakai di beberapa sub rakitan berbeda, misalnya), jadi kebutuhannya
 *    diakumulasi lewat Map, bukan ditimpa tiap cabang.
 */
export function runMrp(tree: BomNode, quantityOrdered: number): MrpResult {
  const rawMaterialAcc = new Map<number, MaterialRequirement>()
  const subAssemblyAcc = new Map<number, SubAssemblyToProduce>()

  function explode(node: BomNode, grossRequirement: number, isRoot: boolean) {
    const stock = parseFloat(node.stockQuantity)
    const netRequirement = isRoot ? grossRequirement : Math.max(0, grossRequirement - stock)
    const isLeaf = node.children.length === 0

    if (isLeaf) {
      const existing = rawMaterialAcc.get(node.productId)
      const totalRequired = (existing?.totalRequired ?? 0) + grossRequirement
      rawMaterialAcc.set(node.productId, {
        productId: node.productId,
        sku: node.sku,
        name: node.name,
        unitOfMeasure: node.unitOfMeasure,
        stockQuantity: stock,
        totalRequired,
        shortage: Math.max(0, totalRequired - stock),
      })
      return
    }

    if (!isRoot && netRequirement > 0) {
      const existing = subAssemblyAcc.get(node.productId)
      const quantityToProduce = (existing?.quantityToProduce ?? 0) + netRequirement
      subAssemblyAcc.set(node.productId, {
        productId: node.productId,
        sku: node.sku,
        name: node.name,
        unitOfMeasure: node.unitOfMeasure,
        quantityToProduce,
      })
    }

    if (netRequirement > 0) {
      for (const child of node.children) {
        const qtyPer = parseFloat(child.quantityPerParent ?? '0')
        explode(child, netRequirement * qtyPer, false)
      }
    }
  }

  explode(tree, quantityOrdered, true)

  return {
    subAssembliesToProduce: Array.from(subAssemblyAcc.values()),
    rawMaterials: Array.from(rawMaterialAcc.values()).sort((a, b) => a.sku.localeCompare(b.sku)),
  }
}
