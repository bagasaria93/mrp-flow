import { eq } from 'drizzle-orm'
import { db } from './index'
import { products, bomItems, productionOrders, purchaseRequests, purchaseRequestApprovals } from './schema'
import { getBomTree } from '../lib/bom'
import { runMrp } from '../lib/mrp'

/**
 * Seed ini ditulis data-driven (daftar produk + BOM sebagai data, bukan
 * insert manual satu-satu) supaya skalanya gampang diperbesar tanpa nulis
 * kode berulang: sekarang ada 10 produk jadi, ~22 sub rakitan, dan 12
 * bahan baku (total sekitar 44 produk), dengan 22 production order yang
 * sudah di-MRP. Jumlah ini sengaja dibuat cukup banyak supaya tabel
 * Production Order dan Purchase Request di UI butuh pagination, bukan
 * cuma daftar pendek yang muat di satu layar.
 *
 * Angka shortage/kekurangan TIDAK dihitung manual, tapi memanggil
 * getBomTree() + runMrp() yang sama persis dipakai tombol "Jalankan MRP"
 * di aplikasi. Jadi walaupun datanya banyak, angkanya dijamin konsisten
 * dengan logika MRP yang sesungguhnya.
 */

type ComponentLine = { rm: string; qty: string }
type SubAssemblyDef = { sku: string; name: string; stock: string; components: ComponentLine[] }
type FinishedGoodDef = { sku: string; name: string; stock: string; subAssemblies: SubAssemblyDef[] }
type RawMaterialDef = { sku: string; name: string; uom: string; stock: string }

const RAW_MATERIALS: RawMaterialDef[] = [
  { sku: 'RM-001', name: 'Kayu Balok', uom: 'batang', stock: '60' },
  { sku: 'RM-002', name: 'Sekrup', uom: 'pcs', stock: '300' },
  { sku: 'RM-003', name: 'Papan Kayu', uom: 'lembar', stock: '40' },
  { sku: 'RM-004', name: 'Busa', uom: 'meter', stock: '15' },
  { sku: 'RM-005', name: 'Lem Kayu', uom: 'liter', stock: '5' },
  { sku: 'RM-006', name: 'Engsel', uom: 'pcs', stock: '25' },
  { sku: 'RM-007', name: 'Paku', uom: 'pcs', stock: '200' },
  { sku: 'RM-008', name: 'Cat Kayu', uom: 'liter', stock: '6' },
  { sku: 'RM-009', name: 'Roda Kastor', uom: 'pcs', stock: '30' },
  { sku: 'RM-010', name: 'Kain Pelapis', uom: 'meter', stock: '12' },
  { sku: 'RM-011', name: 'Kaca Bening', uom: 'lembar', stock: '4' },
  { sku: 'RM-012', name: 'Pegangan Laci', uom: 'pcs', stock: '20' },
]

const FINISHED_GOODS: FinishedGoodDef[] = [
  {
    sku: 'FG-001', name: 'Kursi Kayu', stock: '5',
    subAssemblies: [
      { sku: 'SA-001', name: 'Rangka Kayu', stock: '3', components: [{ rm: 'RM-001', qty: '4' }, { rm: 'RM-002', qty: '12' }] },
      { sku: 'SA-002', name: 'Dudukan Kayu', stock: '2', components: [{ rm: 'RM-003', qty: '1' }, { rm: 'RM-004', qty: '0.5' }] },
    ],
  },
  {
    sku: 'FG-002', name: 'Meja Kayu', stock: '2',
    subAssemblies: [
      { sku: 'SA-003', name: 'Kaki Meja', stock: '0', components: [{ rm: 'RM-001', qty: '2' }, { rm: 'RM-002', qty: '6' }] },
      { sku: 'SA-004', name: 'Permukaan Meja', stock: '0', components: [{ rm: 'RM-003', qty: '3' }, { rm: 'RM-005', qty: '0.2' }] },
    ],
  },
  {
    sku: 'FG-003', name: 'Rak Kayu', stock: '3',
    subAssemblies: [
      { sku: 'SA-005', name: 'Rangka Rak', stock: '1', components: [{ rm: 'RM-001', qty: '6' }, { rm: 'RM-002', qty: '20' }] },
      { sku: 'SA-006', name: 'Papan Rak', stock: '2', components: [{ rm: 'RM-003', qty: '1' }] },
    ],
  },
  {
    sku: 'FG-004', name: 'Lemari Kayu', stock: '1',
    subAssemblies: [
      { sku: 'SA-007', name: 'Rangka Lemari', stock: '1', components: [{ rm: 'RM-001', qty: '8' }, { rm: 'RM-002', qty: '30' }] },
      { sku: 'SA-008', name: 'Pintu Lemari', stock: '0', components: [{ rm: 'RM-003', qty: '2' }, { rm: 'RM-006', qty: '4' }] },
      { sku: 'SA-009', name: 'Panel Kaca Lemari', stock: '0', components: [{ rm: 'RM-011', qty: '2' }, { rm: 'RM-002', qty: '8' }] },
    ],
  },
  {
    sku: 'FG-005', name: 'Bangku Kayu', stock: '4',
    subAssemblies: [
      { sku: 'SA-010', name: 'Rangka Bangku', stock: '2', components: [{ rm: 'RM-001', qty: '3' }, { rm: 'RM-002', qty: '10' }, { rm: 'RM-007', qty: '8' }] },
      { sku: 'SA-011', name: 'Dudukan Bangku', stock: '1', components: [{ rm: 'RM-003', qty: '1' }, { rm: 'RM-010', qty: '1' }] },
    ],
  },
  {
    sku: 'FG-006', name: 'Meja Makan', stock: '1',
    subAssemblies: [
      { sku: 'SA-012', name: 'Kaki Meja Makan', stock: '0', components: [{ rm: 'RM-001', qty: '4' }, { rm: 'RM-002', qty: '12' }] },
      { sku: 'SA-013', name: 'Permukaan Meja Makan', stock: '0', components: [{ rm: 'RM-003', qty: '4' }, { rm: 'RM-005', qty: '0.3' }] },
    ],
  },
  {
    sku: 'FG-007', name: 'Kursi Makan', stock: '6',
    subAssemblies: [
      { sku: 'SA-014', name: 'Rangka Kursi Makan', stock: '3', components: [{ rm: 'RM-001', qty: '3' }, { rm: 'RM-002', qty: '10' }] },
      { sku: 'SA-015', name: 'Dudukan Kursi Makan', stock: '2', components: [{ rm: 'RM-003', qty: '1' }, { rm: 'RM-010', qty: '0.5' }] },
    ],
  },
  {
    sku: 'FG-008', name: 'Rak Sepatu', stock: '2',
    subAssemblies: [
      { sku: 'SA-016', name: 'Rangka Rak Sepatu', stock: '1', components: [{ rm: 'RM-001', qty: '3' }, { rm: 'RM-002', qty: '12' }] },
      { sku: 'SA-017', name: 'Papan Rak Sepatu', stock: '1', components: [{ rm: 'RM-003', qty: '2' }] },
    ],
  },
  {
    sku: 'FG-009', name: 'Laci Kayu', stock: '3',
    subAssemblies: [
      { sku: 'SA-018', name: 'Rangka Laci', stock: '2', components: [{ rm: 'RM-001', qty: '2' }, { rm: 'RM-002', qty: '8' }] },
      { sku: 'SA-019', name: 'Kotak Laci', stock: '1', components: [{ rm: 'RM-003', qty: '2' }, { rm: 'RM-012', qty: '2' }, { rm: 'RM-007', qty: '6' }] },
    ],
  },
  {
    sku: 'FG-010', name: 'Partisi Kayu', stock: '1',
    subAssemblies: [
      { sku: 'SA-020', name: 'Rangka Partisi', stock: '0', components: [{ rm: 'RM-001', qty: '5' }, { rm: 'RM-002', qty: '16' }] },
      { sku: 'SA-021', name: 'Panel Partisi', stock: '0', components: [{ rm: 'RM-003', qty: '3' }, { rm: 'RM-008', qty: '0.4' }] },
      { sku: 'SA-022', name: 'Roda Partisi', stock: '1', components: [{ rm: 'RM-009', qty: '4' }, { rm: 'RM-002', qty: '8' }] },
    ],
  },
]

// Tiap produk jadi dipesan 2-3 kali dengan jumlah berbeda, supaya jumlah
// order dan purchase request cukup banyak untuk butuh pagination di UI.
const ORDER_PLAN: { fg: string; quantities: number[] }[] = [
  { fg: 'FG-001', quantities: [10, 22] },
  { fg: 'FG-002', quantities: [6, 14] },
  { fg: 'FG-003', quantities: [8, 18] },
  { fg: 'FG-004', quantities: [4, 9, 15] },
  { fg: 'FG-005', quantities: [12, 25] },
  { fg: 'FG-006', quantities: [5, 11] },
  { fg: 'FG-007', quantities: [14, 28] },
  { fg: 'FG-008', quantities: [7, 16, 24] },
  { fg: 'FG-009', quantities: [9, 20] },
  { fg: 'FG-010', quantities: [3, 8] },
]

async function seed() {
  console.log('Menghapus data lama...')
  await db.delete(purchaseRequestApprovals)
  await db.delete(purchaseRequests)
  await db.delete(productionOrders)
  await db.delete(bomItems)
  await db.delete(products)

  console.log('Membuat bahan baku...')
  const rmIdBySku = new Map<string, number>()
  for (const rm of RAW_MATERIALS) {
    const [row] = await db
      .insert(products)
      .values({ sku: rm.sku, name: rm.name, type: 'raw_material', unitOfMeasure: rm.uom, stockQuantity: rm.stock })
      .returning()
    rmIdBySku.set(rm.sku, row.id)
  }

  console.log('Membuat produk jadi dan sub rakitan...')
  const fgIdBySku = new Map<string, number>()
  const bomRows: { parentProductId: number; componentProductId: number; quantityRequired: string }[] = []

  for (const fg of FINISHED_GOODS) {
    const [fgRow] = await db
      .insert(products)
      .values({ sku: fg.sku, name: fg.name, type: 'finished_good', unitOfMeasure: 'pcs', stockQuantity: fg.stock })
      .returning()
    fgIdBySku.set(fg.sku, fgRow.id)

    for (const sa of fg.subAssemblies) {
      const [saRow] = await db
        .insert(products)
        .values({ sku: sa.sku, name: sa.name, type: 'sub_assembly', unitOfMeasure: 'pcs', stockQuantity: sa.stock })
        .returning()

      bomRows.push({ parentProductId: fgRow.id, componentProductId: saRow.id, quantityRequired: '1' })

      for (const comp of sa.components) {
        const rmId = rmIdBySku.get(comp.rm)
        if (!rmId) throw new Error(`Raw material ${comp.rm} tidak ditemukan`)
        bomRows.push({ parentProductId: saRow.id, componentProductId: rmId, quantityRequired: comp.qty })
      }
    }
  }

  await db.insert(bomItems).values(bomRows)

  console.log('Membuat production order + menjalankan MRP (pakai engine asli)...')

  async function createOrderWithMrp(productId: number, quantity: number) {
    const [order] = await db
      .insert(productionOrders)
      .values({ productId, quantityOrdered: quantity.toString(), status: 'mrp_run' })
      .returning()

    const tree = await getBomTree(productId)
    if (!tree) throw new Error('BOM tidak ditemukan')
    const result = runMrp(tree, quantity)
    const shortages = result.rawMaterials.filter((rm) => rm.shortage > 0)

    const inserted = shortages.length
      ? await db
          .insert(purchaseRequests)
          .values(
            shortages.map((rm) => ({
              productionOrderId: order.id,
              productId: rm.productId,
              quantityNeeded: rm.shortage.toFixed(4),
            })),
          )
          .returning()
      : []

    return { order, purchaseRequests: inserted }
  }

  const allResults: Awaited<ReturnType<typeof createOrderWithMrp>>[] = []

  for (const plan of ORDER_PLAN) {
    const fgId = fgIdBySku.get(plan.fg)
    if (!fgId) throw new Error(`Produk jadi ${plan.fg} tidak ditemukan`)
    for (const qty of plan.quantities) {
      allResults.push(await createOrderWithMrp(fgId, qty))
    }
  }

  console.log('Mensimulasikan riwayat approval...')

  // Supaya variasi status terlihat natural tanpa perlu ditulis manual satu
  // per satu untuk puluhan order, pola approval-nya diputar berdasarkan
  // urutan order: disetujui penuh -> campuran (sebagian ditolak) -> masih
  // baru menunggu Supervisor -> sudah lolos Supervisor menunggu Manager.
  let orderIndex = 0
  for (const { purchaseRequests: prs } of allResults) {
    const pattern = orderIndex % 4
    orderIndex++
    if (prs.length === 0) continue

    if (pattern === 0) {
      for (const pr of prs) {
        await db.insert(purchaseRequestApprovals).values([
          { purchaseRequestId: pr.id, approverRole: 'supervisor', decision: 'approved' },
          { purchaseRequestId: pr.id, approverRole: 'manager', decision: 'approved' },
        ])
        await db.update(purchaseRequests).set({ status: 'approved' }).where(eq(purchaseRequests.id, pr.id))
      }
    } else if (pattern === 1) {
      const [first] = prs
      await db.insert(purchaseRequestApprovals).values({
        purchaseRequestId: first.id,
        approverRole: 'supervisor',
        decision: 'rejected',
      })
      await db.update(purchaseRequests).set({ status: 'rejected' }).where(eq(purchaseRequests.id, first.id))
      // sisanya (kalau ada) dibiarkan default pending_supervisor
    } else if (pattern === 2) {
      // semua dibiarkan default pending_supervisor, order paling baru
      continue
    } else {
      for (const pr of prs) {
        await db.insert(purchaseRequestApprovals).values({
          purchaseRequestId: pr.id,
          approverRole: 'supervisor',
          decision: 'approved',
        })
        await db.update(purchaseRequests).set({ status: 'pending_manager' }).where(eq(purchaseRequests.id, pr.id))
      }
    }
  }

  const totalSubAssemblies = FINISHED_GOODS.reduce((sum, fg) => sum + fg.subAssemblies.length, 0)
  const totalProducts = RAW_MATERIALS.length + FINISHED_GOODS.length + totalSubAssemblies
  const totalPr = allResults.reduce((sum, r) => sum + r.purchaseRequests.length, 0)

  console.log('Selesai. Ringkasan:')
  console.log(`- ${totalProducts} produk (${FINISHED_GOODS.length} produk jadi, ${totalSubAssemblies} sub rakitan, ${RAW_MATERIALS.length} bahan baku)`)
  console.log(`- ${allResults.length} production order`)
  console.log(`- ${totalPr} purchase request`)

  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed gagal:', err)
  process.exit(1)
})
