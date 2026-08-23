import { db } from '@/db'
import { pingTable } from '@/db/schema'
import { revalidatePath } from 'next/cache'

async function addPing() {
  'use server'
  await db.insert(pingTable).values({
    message: `Halo dari MRP Flow, ${new Date().toLocaleString('id-ID')}`,
  })
  revalidatePath('/')
}

export default async function Home() {
  const pings = await db.select().from(pingTable).orderBy(pingTable.createdAt)

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Uji Koneksi Database</h1>
      <p style={{ color: '#666', marginTop: '0.5rem' }}>
        Halaman ini membaca dan menulis langsung ke tabel <code>ping</code> di Neon Postgres.
      </p>

      <form action={addPing} style={{ marginTop: '1.5rem' }}>
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Tambah Ping
        </button>
      </form>

      <ul style={{ marginTop: '1.5rem', listStyle: 'none', padding: 0 }}>
        {pings.length === 0 && <p style={{ color: '#999' }}>Belum ada data. Klik tombol di atas.</p>}
        {pings.map((p) => (
          <li
            key={p.id}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #eee',
              borderRadius: 6,
              marginBottom: '0.5rem',
            }}
          >
            <strong>#{p.id}</strong> {p.message}
          </li>
        ))}
      </ul>
    </main>
  )
}
