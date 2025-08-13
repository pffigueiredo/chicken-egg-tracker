import { serial, text, pgTable, timestamp, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const chickensTable = pgTable('chickens', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  breed: text('breed').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const eggRecordsTable = pgTable('egg_records', {
  id: serial('id').primaryKey(),
  chicken_id: integer('chicken_id').notNull().references(() => chickensTable.id),
  date: date('date').notNull(),
  quantity: integer('quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const chickensRelations = relations(chickensTable, ({ many }) => ({
  eggRecords: many(eggRecordsTable),
}));

export const eggRecordsRelations = relations(eggRecordsTable, ({ one }) => ({
  chicken: one(chickensTable, {
    fields: [eggRecordsTable.chicken_id],
    references: [chickensTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Chicken = typeof chickensTable.$inferSelect;
export type NewChicken = typeof chickensTable.$inferInsert;
export type EggRecord = typeof eggRecordsTable.$inferSelect;
export type NewEggRecord = typeof eggRecordsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  chickens: chickensTable, 
  eggRecords: eggRecordsTable 
};

export const tableRelations = {
  chickensRelations,
  eggRecordsRelations
};