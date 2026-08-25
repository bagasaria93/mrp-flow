import Link from 'next/link'
import { getDashboardStats } from '@/lib/dashboard'
import { StatTile } from '@/components/StatTile'
import { BarChart } from '@/components/BarChart'
import { formatQty } from '@/lib/format'
import {
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  LayersIcon,
  ClipboardListIcon,
  ShoppingCartIcon,
  ChevronRightIcon,
} from '@/components/icons'

export default async function Home() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Demo alur manufaktur end-to-end: BOM multi-level, MRP explosion dengan netting stok per
          level, purchase request otomatis, sampai approval dua tingkat (Supervisor lalu Manager).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Production Order" value={stats.totalProductionOrders} accent="primary" icon={CubeIcon} />
        <StatTile label="Menunggu Approval" value={stats.pendingApproval} accent="warning" icon={ClockIcon} />
        <StatTile label="Disetujui" value={stats.approved} accent="success" icon={CheckCircleIcon} />
        <StatTile label="Ditolak" value={stats.rejected} accent="danger" icon={XCircleIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200/70 bg-white">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-slate-800">Purchase Request per Status</h2>
          </div>
          <div className="px-4 pb-4">
            <BarChart
              data={stats.statusBreakdown.map((s) => ({
                label: s.label,
                value: s.count,
                color: s.color,
              }))}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/70 bg-white">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-slate-800">Bahan Baku Paling Banyak Diminta</h2>
          </div>
          <div className="px-4 pb-4">
            {stats.topShortageMaterials.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada purchase request aktif.</p>
            ) : (
              <BarChart
                data={stats.topShortageMaterials.map((m) => ({
                  label: `${m.name} (${m.sku})`,
                  value: m.totalQuantity,
                  color: '#4f46e5',
                  displayValue: `${formatQty(m.totalQuantity)} ${m.unitOfMeasure}`,
                }))}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/bom"
          className="group flex items-center justify-between rounded-lg border border-slate-200/70 bg-white p-4 transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayersIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">Struktur BOM</p>
              <p className="mt-0.5 text-xs text-slate-500">Pohon BOM 3 produk, dari produk jadi sampai bahan baku.</p>
            </div>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary" />
        </Link>

        <Link
          href="/production-orders"
          className="group flex items-center justify-between rounded-lg border border-slate-200/70 bg-white p-4 transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ClipboardListIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">Production Order</p>
              <p className="mt-0.5 text-xs text-slate-500">Buat order produksi baru dan jalankan MRP.</p>
            </div>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary" />
        </Link>

        <Link
          href="/purchase-requests"
          className="group flex items-center justify-between rounded-lg border border-slate-200/70 bg-white p-4 transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShoppingCartIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">Purchase Request</p>
              <p className="mt-0.5 text-xs text-slate-500">Approval dua tingkat, ganti role untuk coba tiap sudut pandang.</p>
            </div>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary" />
        </Link>
      </div>
    </div>
  )
}
