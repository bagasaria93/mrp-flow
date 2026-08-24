import { db } from '@/db'
import { products, productionOrders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

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
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Buat Production Order</h1>
      <p className="mt-1 mb-6 text-slate-500">Pilih produk jadi yang mau diproduksi dan berapa jumlahnya.</p>

      <form action={create} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Produk</label>
          <select
            name="productId"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
          >
            {finishedGoods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Jumlah</label>
          <input
            type="number"
            name="quantity"
            min={1}
            step="any"
            defaultValue={10}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Buat Order
        </button>
      </form>
    </main>
  )
}
