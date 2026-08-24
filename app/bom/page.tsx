import { db } from '@/db'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getBomTree } from '@/lib/bom'
import { BomTreeNode } from '@/components/BomTreeNode'

export default async function BomPage() {
  const finishedGoods = await db
    .select()
    .from(products)
    .where(eq(products.type, 'finished_good'))

  const trees = await Promise.all(finishedGoods.map((fg) => getBomTree(fg.id)))

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Struktur BOM</h1>
      <p className="mt-1 mb-8 text-slate-500">
        Ditampilkan secara rekursif: produk jadi, sub rakitan, sampai bahan baku paling dasar.
      </p>

      <div className="space-y-6">
        {trees.map((tree) => tree && <BomTreeNode key={tree.productId} node={tree} />)}
      </div>

      {trees.length === 0 && (
        <p className="text-slate-400">Belum ada produk jadi. Jalankan `npm run db:seed` dulu.</p>
      )}
    </main>
  )
}
