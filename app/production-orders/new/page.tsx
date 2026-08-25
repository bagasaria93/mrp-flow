import { db } from '@/db'
import { products, productionOrders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function create(formData: FormData) {
  'use server'
  const productId = Number(formData.get('productId'))
  const quantityRaw = formData.get('quantity')?.toString() ?? ''
  const quantity = parseFloat(quantityRaw)

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Produk dan jumlah harus diisi dengan benar')
  }

  const [order] = await db
    .insert(productionOrders)
    .values({ productId, quantityOrdered: quantity.toString() })
    .returning()

  redirect(`/production-orders/${order.id}`)
}

export default async function NewProductionOrderPage() {
  const finishedGoods = await db.select().from(products).where(eq(products.type, 'finished_good'))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/production-orders" className="text-sm text-slate-400 hover:text-primary">
          &larr; Semua production order
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-800">Buat Production Order</h1>
        <p className="mt-1 text-sm text-slate-500">Pilih produk jadi yang mau diproduksi dan berapa jumlahnya.</p>
      </div>

      <div className="max-w-lg overflow-hidden rounded-lg border border-slate-200/70 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Detail Order</h2>
        </div>
        <form action={create} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Produk</label>
            <select
              name="productId"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none"
            >
              {finishedGoods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Jumlah</label>
            <input
              type="number"
              name="quantity"
              min={1}
              step="any"
              defaultValue={10}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Buat Order
          </button>
        </form>
      </div>
    </div>
  )
}
