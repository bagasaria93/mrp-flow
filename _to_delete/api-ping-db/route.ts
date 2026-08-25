import { db } from '@/db'
import { sql } from 'drizzle-orm'

/**
 * Endpoint diagnostik sementara: query paling sederhana yang mungkin
 * (select 1), tanpa render React, tanpa layout, tanpa cookies. Dipakai
 * untuk mengisolasi apakah lambatnya itu murni round-trip ke Neon, atau
 * ada bagian lain di Next.js/Turbopack yang ikut menyumbang. Aman dihapus
 * kapan saja setelah selesai diagnosa, tidak dipakai fitur mana pun.
 */
export async function GET() {
  const start = Date.now()
  await db.execute(sql`select 1`)
  const dbMs = Date.now() - start
  return Response.json({ dbMs })
}
