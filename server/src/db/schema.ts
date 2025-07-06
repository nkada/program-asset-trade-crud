
import { serial, text, pgTable, timestamp, numeric, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const programsTable = pgTable('programs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const assetsTable = pgTable('assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  currency: text('currency').notNull(),
  value: numeric('value', { precision: 15, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const tradesTable = pgTable('trades', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  program_id: integer('program_id').references(() => programsTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for many-to-many relationship between trades and assets
export const tradeAssetsTable = pgTable('trade_assets', {
  trade_id: integer('trade_id').references(() => tradesTable.id).notNull(),
  asset_id: integer('asset_id').references(() => assetsTable.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.trade_id, table.asset_id] })
}));

// Relations
export const programsRelations = relations(programsTable, ({ many }) => ({
  trades: many(tradesTable),
}));

export const tradesRelations = relations(tradesTable, ({ one, many }) => ({
  program: one(programsTable, {
    fields: [tradesTable.program_id],
    references: [programsTable.id],
  }),
  tradeAssets: many(tradeAssetsTable),
}));

export const assetsRelations = relations(assetsTable, ({ many }) => ({
  tradeAssets: many(tradeAssetsTable),
}));

export const tradeAssetsRelations = relations(tradeAssetsTable, ({ one }) => ({
  trade: one(tradesTable, {
    fields: [tradeAssetsTable.trade_id],
    references: [tradesTable.id],
  }),
  asset: one(assetsTable, {
    fields: [tradeAssetsTable.asset_id],
    references: [assetsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = { 
  programs: programsTable, 
  assets: assetsTable, 
  trades: tradesTable, 
  tradeAssets: tradeAssetsTable 
};

// TypeScript types for the table schemas
export type Program = typeof programsTable.$inferSelect;
export type NewProgram = typeof programsTable.$inferInsert;
export type Asset = typeof assetsTable.$inferSelect;
export type NewAsset = typeof assetsTable.$inferInsert;
export type Trade = typeof tradesTable.$inferSelect;
export type NewTrade = typeof tradesTable.$inferInsert;
export type TradeAsset = typeof tradeAssetsTable.$inferSelect;
export type NewTradeAsset = typeof tradeAssetsTable.$inferInsert;
