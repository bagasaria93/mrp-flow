import { pgTable, serial, text, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'

// Tipe produk: bisa raw material (bahan baku), sub assembly (barang setengah jadi
// yang punya BOM sendiri), atau finished good (produk akhir yang dijual/dipesan)
export const productTypeEnum = pgEnum('product_type', [
  'raw_material',
  'sub_assembly',
  'finished_good',
])

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  type: productTypeEnum('type').notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(), // pcs, kg, meter, dst
  stockQuantity: numeric('stock_quantity', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Bill of Material: self-referencing ke tabel products.
// Satu baris berarti "untuk membuat 1 unit parentProduct, butuh quantityRequired
// unit componentProduct". Karena componentProduct juga bisa punya baris BOM
// sendiri (sebagai parent di baris lain), struktur ini otomatis mendukung
// BOM berlapis / multi-level tanpa perlu kolom tambahan.
export const bomItems = pgTable('bom_items', {
  id: serial('id').primaryKey(),
  parentProductId: integer('parent_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  componentProductId: integer('component_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  quantityRequired: numeric('quantity_required', { precision: 12, scale: 4 }).notNull(),
})

export const productionOrderStatusEnum = pgEnum('production_order_status', [
  'planned', // baru dibuat, belum dijalankan MRP
  'mrp_run', // MRP sudah dijalankan, purchase request sudah dibuat
  'completed',
])

export const productionOrders = pgTable('production_orders', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantityOrdered: numeric('quantity_ordered', { precision: 12, scale: 2 }).notNull(),
  status: productionOrderStatusEnum('status').notNull().default('planned'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const purchaseRequestStatusEnum = pgEnum('purchase_request_status', [
  'pending_supervisor',
  'pending_manager',
  'approved',
  'rejected',
])

// Hasil MRP run: kekurangan material yang perlu dibeli untuk memenuhi satu
// production order. Statusnya berjenjang, harus lewat supervisor dulu baru
// manager, sebelum dianggap approved.
export const purchaseRequests = pgTable('purchase_requests', {
  id: serial('id').primaryKey(),
  productionOrderId: integer('production_order_id')
    .notNull()
    .references(() => productionOrders.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantityNeeded: numeric('quantity_needed', { precision: 12, scale: 4 }).notNull(),
  status: purchaseRequestStatusEnum('status').notNull().default('pending_supervisor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const approverRoleEnum = pgEnum('approver_role', ['supervisor', 'manager'])
export const approvalDecisionEnum = pgEnum('approval_decision', ['approved', 'rejected'])

// Audit trail: rekam tiap keputusan approval di tiap tingkat, siapa (role
// apa) memutuskan apa dan kapan.
export const purchaseRequestApprovals = pgTable('purchase_request_approvals', {
  id: serial('id').primaryKey(),
  purchaseRequestId: integer('purchase_request_id')
    .notNull()
    .references(() => purchaseRequests.id, { onDelete: 'cascade' }),
  approverRole: approverRoleEnum('approver_role').notNull(),
  decision: approvalDecisionEnum('decision').notNull(),
  note: text('note'),
  decidedAt: timestamp('decided_at').defaultNow().notNull(),
})

// Tabel percobaan koneksi awal, boleh dihapus nanti setelah semua modul jalan
export const pingTable = pgTable('ping', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
