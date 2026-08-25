export type BarDatum = {
  label: string
  value: number
  color: string
  displayValue?: string
}

/**
 * Horizontal bar chart sederhana, dirender murni sebagai HTML (Server
 * Component, tidak butuh JS di client). Nilai selalu ditulis langsung di
 * sebelah label (direct label), jadi tetap terbaca jelas tanpa perlu hover.
 * Atribut title di setiap baris jadi tooltip native browser sebagai
 * pelengkap, bukan pengganti, direct label.
 */
export function BarChart({ data, maxValue }: { data: BarDatum[]; maxValue?: number }) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-4">
      {data.map((d) => {
        const widthPct = max > 0 ? Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0) : 0
        return (
          <div key={d.label} title={`${d.label}: ${d.displayValue ?? d.value}`}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">{d.label}</span>
              <span className="font-bold tabular-nums text-slate-800">{d.displayValue ?? d.value}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
