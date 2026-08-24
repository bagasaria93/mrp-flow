import { cookies } from 'next/headers'

export type Role = 'staff' | 'supervisor' | 'manager'

export const ROLE_LABEL: Record<Role, string> = {
  staff: 'Staff',
  supervisor: 'Supervisor',
  manager: 'Manager',
}

/**
 * Tidak ada sistem login sungguhan di demo ini (sengaja, biar recruiter bisa
 * langsung coba tanpa daftar akun). Role "sedang login sebagai apa" disimpan
 * di cookie, diganti lewat dropdown di NavBar. Ini cukup untuk membuktikan
 * konsep RBAC dan approval berjenjang jalan, tanpa kompleksitas auth penuh.
 */
export async function getCurrentRole(): Promise<Role> {
  const cookieStore = await cookies()
  const value = cookieStore.get('current_role')?.value
  if (value === 'supervisor' || value === 'manager' || value === 'staff') return value
  return 'staff'
}
