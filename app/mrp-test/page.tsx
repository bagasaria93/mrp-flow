import { db } from '@/db'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getBomTree } from '@/lib/bom'
import { runMrp } from '@/lib/mrp'
import { formatQty } from '@/lib/format'

export default async function MrpTestPage({
  searchParams,
}: {
  searchParams: Promise<{ qty?: string }>
}) {
  const { qty } = await searchParams
  const quantity = qty ? parseFloat(qty) : 10

  const [kursiKayu] = await db.select().from(products).where(eq(products.sku, 'FG-001'))

  if (!kursiKayu) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-slate-900">
        Data belum ada. Jalankan <code>npm run db:seed</code> dulu.
      </main>
    )
  }

  const tree = await getBomTree(kursiKayu.id)
  const result = tree ? runMrp(tree, quantity) : null

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Uji MRP Run</h1>
      <p className="mt-1 mb-6 text-slate-500">
        Menghitung kebutuhan produksi dan bahan baku untuk order {kursiKayu.name}.
      </p>

      <form className="mb-8 flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Jumlah pesanan (pcs)</label>
          <input
            type="number"
            name="qty"
            defaultValue={quantity}
            min={1}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Hitung
        </button>
      </form>

      {result && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Sub Rakitan yang Perlu Diproduksi</h2>
            {result.subAssembliesToProduce.length === 0 && (
              <p className="text-sm text-slate-400">Stok sub rakitan sudah cukup, tidak perlu produksi tambahan.</p>
            )}
            <div className="space-y-2">
              {result.subAssembliesToProduce.map((sa) => (
                <div
                  key={sa.productId}
                  className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-2"
                >
                  <span className="font-medium text-slate-900">
                    {sa.name} <span className="font-normal text-slate-400">{sa.sku}</span>
                  </span>
                  <span className="text-sm text-slate-700">
                    produksi {formatQty(sa.quantityToProduce)} {sa.unitOfMeasure}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Kebutuhan Bahan Baku</h2>
            <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-600">
                  <th className="px-4 py-2 font-medium">Bahan Baku</th>
                  <th className="px-4 py-2 font-medium">Total Dibutuhkan</th>
                  <th className="px-4 py-2 font-medium">Stok</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.rawMaterials.map((rm) => (
                  <tr key={rm.productId} className="border-t border-slate-200">
                    <td className="px-4 py-2 text-slate-900">
                      {rm.name} <span className="text-slate-400">{rm.sku}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {formatQty(rm.totalRequired)} {rm.unitOfMeasure}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {formatQty(rm.stockQuantity)} {rm.unitOfMeasure}
                    </td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        rm.shortage > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {rm.shortage > 0 ? `kurang ${formatQty(rm.shortage)} ${rm.unitOfMeasure}` : 'cukup'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}
