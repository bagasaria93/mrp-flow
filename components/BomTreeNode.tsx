import type { BomNode } from '@/lib/bom'
import { formatQty } from '@/lib/format'

const typeLabel: Record<BomNode['type'], string> = {
  finished_good: 'Produk Jadi',
  sub_assembly: 'Sub Rakitan',
  raw_material: 'Bahan Baku',
}

const typeBadgeClass: Record<BomNode['type'], string> = {
  finished_good: 'bg-teal-100 text-teal-800',
  sub_assembly: 'bg-amber-100 text-amber-800',
  raw_material: 'bg-slate-200 text-slate-700',
}

/**
 * Komponen rekursif: tiap node BOM bisa punya children, dan tiap children
 * itu sendiri di-render lagi lewat <BomTreeNode> yang sama. Ini yang
 * memungkinkan pohon BOM berlapis tak terbatas ditampilkan tanpa perlu tahu
 * dulu berapa dalam levelnya.
 */
export function BomTreeNode({ node, depth = 0 }: { node: BomNode; depth?: number }) {
  return (
    <div className={depth > 0 ? 'ml-6 mt-2' : ''}>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
          depth === 0 ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-white'
        }`}
      >
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${typeBadgeClass[node.type]}`}
        >
          {typeLabel[node.type]}
        </span>
        <span className="font-semibold text-slate-900">{node.name}</span>
        <span className="text-sm text-slate-400">{node.sku}</span>

        <div className="ml-auto flex items-center gap-4 text-sm">
          {node.quantityPerParent !== null && (
            <span className="text-slate-600">
              butuh <span className="font-medium text-slate-900">{formatQty(node.quantityPerParent)}</span>{' '}
              {node.unitOfMeasure} / unit induk
            </span>
          )}
          <span className="text-slate-500">
            stok: <span className="font-medium text-slate-700">{formatQty(node.stockQuantity)}</span>{' '}
            {node.unitOfMeasure}
          </span>
        </div>
      </div>

      {node.children.map((child) => (
        <BomTreeNode key={child.productId} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
