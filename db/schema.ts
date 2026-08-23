import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const pingTable = pgTable('ping', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
