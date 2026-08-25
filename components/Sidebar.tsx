'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardIcon,
  LayersIcon,
  ClipboardListIcon,
  ShoppingCartIcon,
} from './icons'

const navItems = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/bom', label: 'Struktur BOM', icon: LayersIcon },
  { href: '/production-orders', label: 'Production Order', icon: ClipboardListIcon },
  { href: '/purchase-requests', label: 'Purchase Request', icon: ShoppingCartIcon },
]

/**
 * Sidebar navigasi gaya admin dashboard modern: dasar gelap datar (bukan
 * gradient biru khas template Bootstrap gratisan), dengan garis aksen tipis
 * di kiri item yang aktif, bukan blok highlight penuh. Ikon + label,
 * highlight otomatis berdasarkan pathname saat ini.
 */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
          M
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-white">MRP Flow</span>
      </div>

      <p className="px-5 pb-2 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        Menu Utama
      </p>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md border-l-2 py-2 pl-3 pr-3 text-[13.5px] font-medium transition-colors ${
                active
                  ? 'border-primary bg-white/5 text-white'
                  : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Demo portofolio, dibuat oleh Bagas Aria Sativa
        </p>
      </div>
    </aside>
  )
}
