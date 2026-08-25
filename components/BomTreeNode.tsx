import type { BomNode } from '@/lib/bom'
import { formatQty } from '@/lib/format'

const typeLabel: Record<BomNode['type'], string> = {
  finished_good: 'Produk Jadi',
  sub_assembly: 'Sub Rakitan',
  raw_material: 'Bahan Baku',
}

const typeBadgeClass: Record<BomNode['type'], string> = {
  finished_good: 'bg-primary/10 text-primary',
  sub_assembly: 'bg-warning/15 text-warning',
  raw_material: 'bg-slate-100 text-slate-600',
}

/**
 * Komponen rekursif: tiap node BOM bisa punya children, dan tiap children
 * itu sendiri di-render lagi lewat <BomTreeNode> yang sama. Ini yang
 * memungkinkan pohon BOM berlapis tak terbatas ditampilkan tanpa perlu tahu
 * dulu berapa dalam levelnya. Garis vertikal di kiri anak-node dipakai
 * sebagai penanda hierarki, mirip tree view di software sungguhan.
 */
export function BomTreeNode({ node, depth = 0 }: { node: BomNode; depth?: number }) {
  return (
    <div className={depth > 0 ? 'ml-3 border-l-2 border-slate-100 pl-4' : ''}>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
          depth === 0 ? 'border-slate-200 bg-slate-50' : 'border-slate-200/70 bg-white'
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

      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <BomTreeNode key={child.productId} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
