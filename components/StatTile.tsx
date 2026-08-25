import type { ComponentType, SVGProps } from 'react'

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const accentDot: Record<Accent, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}
const accentText: Record<Accent, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

/**
 * Stat card minimal: label kecil netral, angka besar jadi fokus utama,
 * dan satu titik warna kecil (bukan border tebal berwarna) sebagai
 * penanda kategori. Ikon dipakai jauh lebih halus (opacity rendah) supaya
 * tidak bersaing dengan angkanya.
 */
export function StatTile({
  label,
  value,
  hint,
  accent = 'primary',
  icon: Icon,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: Accent
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${accentDot[accent]}`} />
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
        {Icon && <Icon className={`h-4 w-4 opacity-40 ${accentText[accent]}`} />}
      </div>
      <p className="mt-2 text-[28px] font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
