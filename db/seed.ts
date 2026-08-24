import { db } from './index'
import { products, bomItems } from './schema'

async function seed() {
  console.log('Menghapus data lama...')
  await db.delete(bomItems)
  await db.delete(products)

  console.log('Membuat produk...')

  // Finished good
  const [kursiKayu] = await db
    .insert(products)
    .values({ sku: 'FG-001', name: 'Kursi Kayu', type: 'finished_good', unitOfMeasure: 'pcs', stockQuantity: '5' })
    .returning()

  // Sub assemblies
  const [rangkaKayu] = await db
    .insert(products)
    .values({ sku: 'SA-001', name: 'Rangka Kayu', type: 'sub_assembly', unitOfMeasure: 'pcs', stockQuantity: '3' })
    .returning()

  const [dudukanKayu] = await db
    .insert(products)
    .values({ sku: 'SA-002', name: 'Dudukan Kayu', type: 'sub_assembly', unitOfMeasure: 'pcs', stockQuantity: '2' })
    .returning()

  // Raw materials
  const [kayuBalok] = await db
    .insert(products)
    .values({ sku: 'RM-001', name: 'Kayu Balok', type: 'raw_material', unitOfMeasure: 'batang', stockQuantity: '20' })
    .returning()

  const [sekrup] = await db
    .insert(products)
    .values({ sku: 'RM-002', name: 'Sekrup', type: 'raw_material', unitOfMeasure: 'pcs', stockQuantity: '100' })
    .returning()

  const [papanKayu] = await db
    .insert(products)
    .values({ sku: 'RM-003', name: 'Papan Kayu', type: 'raw_material', unitOfMeasure: 'lembar', stockQuantity: '8' })
    .returning()

  const [busa] = await db
    .insert(products)
    .values({ sku: 'RM-004', name: 'Busa', type: 'raw_material', unitOfMeasure: 'meter', stockQuantity: '10' })
    .returning()

  console.log('Membuat struktur BOM (multi-level)...')

  // Level 1: Kursi Kayu butuh Rangka Kayu dan Dudukan Kayu
  await db.insert(bomItems).values([
    { parentProductId: kursiKayu.id, componentProductId: rangkaKayu.id, quantityRequired: '1' },
    { parentProductId: kursiKayu.id, componentProductId: dudukanKayu.id, quantityRequired: '1' },
  ])

  // Level 2: Rangka Kayu butuh Kayu Balok dan Sekrup
  await db.insert(bomItems).values([
    { parentProductId: rangkaKayu.id, componentProductId: kayuBalok.id, quantityRequired: '4' },
    { parentProductId: rangkaKayu.id, componentProductId: sekrup.id, quantityRequired: '12' },
  ])

  // Level 2: Dudukan Kayu butuh Papan Kayu dan Busa
  await db.insert(bomItems).values([
    { parentProductId: dudukanKayu.id, componentProductId: papanKayu.id, quantityRequired: '1' },
    { parentProductId: dudukanKayu.id, componentProductId: busa.id, quantityRequired: '0.5' },
  ])

  console.log('Selesai. Struktur BOM:')
  console.log('Kursi Kayu (finished good)')
  console.log('  -> Rangka Kayu x1 (sub assembly)')
  console.log('       -> Kayu Balok x4')
  console.log('       -> Sekrup x12')
  console.log('  -> Dudukan Kayu x1 (sub assembly)')
  console.log('       -> Papan Kayu x1')
  console.log('       -> Busa x0.5')

  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed gagal:', err)
  process.exit(1)
})
