import { getCurrentRole } from '@/lib/role'
import { setRole } from '@/lib/actions'

/**
 * Topbar tipis di atas konten: konteks singkat di kiri, role switcher di
 * kanan. Border tipis sebagai pembatas, tanpa shadow tebal, biar terasa
 * ringan konsisten dengan sidebar yang flat.
 */
export async function Topbar() {
  const role = await getCurrentRole()

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200/70 bg-white px-4 md:px-6">
      <p className="hidden text-sm text-slate-400 sm:block">
        Demo alur manufaktur end-to-end untuk portofolio
      </p>
      <form action={setRole} className="ml-auto flex items-center gap-2 text-sm">
        <label className="hidden text-slate-400 sm:inline">Login sebagai:</label>
        <select
          key={role}
          name="role"
          defaultValue={role}
          className="rounded-md border border-slate-200 px-2 py-1.5 text-slate-900 focus:border-primary focus:outline-none"
        >
          <option value="staff">Staff</option>
          <option value="supervisor">Supervisor</option>
          <option value="manager">Manager</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          Ganti
        </button>
      </form>
    </header>
  )
}
