'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setRole(formData: FormData) {
  const role = formData.get('role')?.toString() ?? 'staff'
  const cookieStore = await cookies()
  cookieStore.set('current_role', role, { path: '/' })
  // Revalidate seluruh layout (termasuk NavBar) supaya label role di pojok
  // kanan atas langsung ikut berubah, dan halaman yang sedang dibuka tetap
  // di tempat (tidak redirect ke home).
  revalidatePath('/', 'layout')
}
