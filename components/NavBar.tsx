import Link from 'next/link'
import { getCurrentRole } from '@/lib/role'
import { setRole } from '@/lib/actions'

export async function NavBar() {
  const role = await getCurrentRole()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-700">
          <Link href="/" className="font-bold text-slate-900">
            MRP Flow
          </Link>
          <Link href="/bom" className="hover:text-slate-900">
            BOM
          </Link>
          <Link href="/production-orders" className="hover:text-slate-900">
            Production Order
          </Link>
          <Link href="/purchase-requests" className="hover:text-slate-900">
            Purchase Request
          </Link>
        </nav>

        <form action={setRole} className="flex items-center gap-2 text-sm">
          <label className="text-slate-500">Login sebagai:</label>
          <select
            name="role"
            defaultValue={role}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-900"
          >
            <option value="staff">Staff</option>
            <option value="supervisor">Supervisor</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
          >
            Ganti
          </button>
        </form>
      </div>
    </header>
  )
}
