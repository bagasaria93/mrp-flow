import { db } from '@/db'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getBomTrees } from '@/lib/bom'
import { BomTreeNode } from '@/components/BomTreeNode'

export default async function BomPage() {
  const finishedGoods = await db
    .select()
    .from(products)
    .where(eq(products.type, 'finished_good'))

  const trees = await getBomTrees(finishedGoods.map((fg) => fg.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Struktur BOM</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ditampilkan secara rekursif: produk jadi, sub rakitan, sampai bahan baku paling dasar.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200/70 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-slate-800">{trees.length} Produk Jadi</h2>
        </div>
        <div className="space-y-6 px-4 pb-4">
          {trees.map((tree) => tree && <BomTreeNode key={tree.productId} node={tree} />)}

          {trees.length === 0 && (
            <p className="text-slate-400">Belum ada produk jadi. Jalankan `npm run db:seed` dulu.</p>
          )}
        </div>
      </div>
    </div>
  )
}
