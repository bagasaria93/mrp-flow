import Link from 'next/link'
import { getCurrentRole } from '@/lib/role'
import { setRole } from '@/lib/actions'

export async function NavBar() {
  const role = await getCurrentRole()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs text-white">
              M
            </span>
            MRP Flow
          </Link>
          <Link href="/bom" className="hover:text-indigo-600">
            BOM
          </Link>
          <Link href="/production-orders" className="hover:text-indigo-600">
            Production Order
          </Link>
          <Link href="/purchase-requests" className="hover:text-indigo-600">
            Purchase Request
          </Link>
        </nav>

        <form action={setRole} className="flex items-center gap-2 text-sm">
          <label className="text-slate-400">Login sebagai:</label>
          <select
            key={role}
            name="role"
            defaultValue={role}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="staff">Staff</option>
            <option value="supervisor">Supervisor</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Ganti
          </button>
        </form>
      </div>
    </header>
  )
}
